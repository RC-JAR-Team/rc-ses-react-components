import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { vi } from 'vitest'

import theme from '@/theme/light'

import RcSesSearchInput from './index'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}))

// Fake md breakpoint so the search button is always rendered
vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>()
  return {
    ...actual,
    useMediaQuery: () => true,
  }
})

type WrapperProps = Partial<React.ComponentProps<typeof RcSesSearchInput>> & {
  onSearch?: (value: string) => void
  defaultValue?: string
}

const TestWrapper = ({
  defaultValue = '',
  onSearch = vi.fn(),
  ...props
}: WrapperProps) => {
  const { control } = useForm({ defaultValues: { search: defaultValue } })
  return (
    <ThemeProvider theme={theme}>
      <RcSesSearchInput
        id='search'
        name='search'
        control={control}
        label='Search'
        errors={undefined}
        onSearch={onSearch}
        {...props}
      />
    </ThemeProvider>
  )
}

describe('RcSesSearchInput', () => {
  test('renders the text input', () => {
    render(<TestWrapper />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  test('renders label', () => {
    render(<TestWrapper label='My label' />)
    expect(screen.getByText('My label')).toBeInTheDocument()
  })

  test('does not show clear button when value is empty', () => {
    render(<TestWrapper />)
    expect(
      screen.queryByRole('button', { name: /clearValueAriaLabel/i }),
    ).not.toBeInTheDocument()
  })

  test('search button is disabled when input is empty', () => {
    render(<TestWrapper />)
    const btn = screen.getByRole('button', { name: /search/i })
    expect(btn).toBeDisabled()
  })

  test('search button is not rendered when showSearchButton=false', () => {
    render(<TestWrapper showSearchButton={false} />)
    expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument()
  })

  describe('handleSearchClick', () => {
    test('calls onSearch with current value when button is clicked', async () => {
      const user = userEvent.setup()
      const onSearch = vi.fn()
      render(<TestWrapper onSearch={onSearch} defaultValue='hello' />)

      await user.click(screen.getByRole('button', { name: /search/i }))

      expect(onSearch).toHaveBeenCalledWith('hello')
    })

    test('does not call onSearch when slotProps.searchButton.onClick calls preventDefault', async () => {
      const user = userEvent.setup()
      const onSearch = vi.fn()

      render(
        <TestWrapper
          onSearch={onSearch}
          defaultValue='test'
          slotProps={{
            searchButton: {
              onClick: (e) => e.preventDefault(),
            },
          }}
        />,
      )

      await user.click(screen.getByRole('button', { name: /search/i }))

      expect(onSearch).not.toHaveBeenCalled()
    })
  })

  describe('handleFieldKeyDown', () => {
    test('calls onSearch on Enter when search button is hidden', async () => {
      const user = userEvent.setup()
      const onSearch = vi.fn()
      render(<TestWrapper onSearch={onSearch} showSearchButton={false} />)

      await user.type(screen.getByRole('textbox'), 'query{Enter}')

      expect(onSearch).toHaveBeenCalledWith('query')
    })

    test('does not call onSearch on Enter when value is empty', async () => {
      const user = userEvent.setup()
      const onSearch = vi.fn()
      render(<TestWrapper onSearch={onSearch} showSearchButton={false} />)

      await user.click(screen.getByRole('textbox'))
      await user.keyboard('{Enter}')

      expect(onSearch).not.toHaveBeenCalled()
    })

    test('does not call onSearch on Enter when search button is enabled (shouldSearchOnEnter=false)', async () => {
      const user = userEvent.setup()
      const onSearch = vi.fn()
      render(<TestWrapper onSearch={onSearch} defaultValue='hello' />)

      await user.click(screen.getByRole('textbox'))
      await user.keyboard('{Enter}')

      expect(onSearch).not.toHaveBeenCalled()
    })

    test('does not call onSearch when slotProps.field.onKeyDown calls preventDefault', async () => {
      const user = userEvent.setup()
      const onSearch = vi.fn()

      render(
        <TestWrapper
          onSearch={onSearch}
          showSearchButton={false}
          slotProps={{
            field: {
              onKeyDown: (e) => {
                if (e.key === 'Enter') e.preventDefault()
              },
            },
          }}
        />,
      )

      await user.type(screen.getByRole('textbox'), 'hi{Enter}')

      expect(onSearch).not.toHaveBeenCalled()
    })
  })

  describe('handleFieldChange', () => {
    test('updates field value as user types', async () => {
      const user = userEvent.setup()
      render(<TestWrapper />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'hello')

      expect(input).toHaveValue('hello')
    })

    test('strips non-numeric characters when onlyNumbers=true', async () => {
      const user = userEvent.setup()
      render(<TestWrapper onlyNumbers />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ab12cd3')

      expect(input).toHaveValue('123')
    })

    test('calls slotProps.field.onChange before updating value', async () => {
      const user = userEvent.setup()
      const fieldOnChange = vi.fn()

      render(<TestWrapper slotProps={{ field: { onChange: fieldOnChange } }} />)

      await user.type(screen.getByRole('textbox'), 'x')

      expect(fieldOnChange).toHaveBeenCalled()
    })
  })
})
