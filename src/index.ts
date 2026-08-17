/**
 * @neon-law-foundation/navigator-ux — a dependency-free React component
 * library on the Neon Law teal.
 *
 * Copyright (c) 2026 Neon Law Foundation.
 * SPDX-License-Identifier: MIT OR Apache-2.0
 */

// The base stylesheet: fonts, the token contract, and every component rule.
// One identity ships. A brand layer is something your app writes for itself —
// see the library README for the template.
import './styles/theme.css'

export { ThemeProvider, useTheme, type Theme, type ThemeProviderProps } from './theme/ThemeProvider'

/* -- The public surface: chrome, marketing blocks, and forms, in nav-* ------ */

export { Icon, ICON_NAMES, type IconName, type IconProps } from './components/Icon'
export {
  Card,
  PricingCard,
  PricingGrid,
  TestimonialCard,
  TestimonialGrid,
  TestimonialSection,
  type CardProps,
  type PricingCardProps,
  type PricingGridProps,
  type TestimonialCardProps,
  type TestimonialSectionProps,
} from './components/Surfaces'
export {
  Alert,
  Flash,
  ImpersonationBanner,
  LegalDisclaimer,
  Toast,
  type AlertProps,
  type FlashProps,
  type FlashTone,
  type ImpersonationBannerProps,
  type LegalDisclaimerProps,
  type ToastProps,
  type ToastTone,
} from './components/Feedback'
export {
  Breadcrumb,
  ExternalLink,
  NavBadge,
  NavButton,
  NavLinkButton,
  type BreadcrumbItem,
  type BreadcrumbProps,
  type ButtonVariant,
  type ExternalLinkProps,
  type NavButtonProps,
  type NavLinkButtonProps,
} from './components/Navigation'
export {
  DataTable,
  Pagination,
  RowActions,
  type DataColumn,
  type DataTableProps,
  type PaginationProps,
  type RowAction,
  type RowActionLink,
  type RowActionPost,
  type RowActionsProps,
  type SortDirection,
} from './components/DataTable'
export { ConfirmDelete, type ConfirmDeleteProps } from './components/ConfirmDelete'
export {
  CheckboxField,
  FormCard,
  PeopleList,
  RadioGroup,
  SelectField,
  TextField,
  TextareaField,
  type CheckboxFieldProps,
  type FormCardProps,
  type PeopleListProps,
  type Person,
  type RadioChoice,
  type RadioGroupProps,
  type SelectFieldProps,
  type SelectOption,
  type TextFieldProps,
  type TextareaFieldProps,
} from './components/Form'
export {
  NavigatorFooter,
  NavigatorNavbar,
  NavigatorShell,
  PageHeader,
  PublicShell,
  SiteFooter,
  SiteHeader,
  type ChromeLink,
  type FooterOffice,
  type NavigatorFooterProps,
  type NavigatorNavbarProps,
  type PageHeaderProps,
  type ShellFrameProps,
  type SiteFooterProps,
  type SiteHeaderProps,
} from './components/Chrome'
export { Prose, Runs, type ProseProps, type Run, type RunStyle, type RunsProps } from './components/Prose'

/* -- The shadcn-derived set. A superset of the Dioxus surface: none of these --
 * -- has a counterpart in the legacy static surface. Same three contracts,   --
 * -- no Tailwind, no Radix, no runtime dependency.                           -- */

export {
  Accordion,
  Collapsible,
  type AccordionItem,
  type AccordionProps,
  type CollapsibleProps,
} from './components/Disclosure'
export {
  AspectRatio,
  Avatar,
  Progress,
  Separator,
  Skeleton,
  type AspectRatioProps,
  type AvatarProps,
  type ProgressProps,
  type SeparatorProps,
  type SkeletonProps,
} from './components/Display'
export { initialsFor } from './lib/initials'
export {
  Combobox,
  Switch,
  ToggleGroup,
  type ComboboxProps,
  type SwitchProps,
  type ToggleGroupProps,
  type ToggleOption,
} from './components/Controls'
export {
  LinkTabs,
  Tabs,
  type LinkTab,
  type LinkTabsProps,
  type TabItem,
  type TabsProps,
} from './components/Tabs'
export {
  Dialog,
  DropdownMenu,
  Popover,
  Sheet,
  Tooltip,
  type DialogProps,
  type DropdownMenuProps,
  type MenuItem,
  type PopoverProps,
  type SheetProps,
  type TooltipProps,
} from './components/Overlay'
export { Toaster, type ToasterProps } from './components/Toaster'
export {
  useToasts,
  type ToastOptions,
  type ToastRecord,
  type UseToasts,
} from './lib/use-toasts'

/* ------------------------------ Matter surfaces, on the new token layer -- */

export { SessionProvider, useSession, type SessionProviderProps } from './session/SessionProvider'
export {
  fetchSession,
  isExpired,
  nowUnix,
  redirectToLogin,
  secondsRemaining,
  LOGIN_PATH,
  SESSION_ENDPOINT,
  type Session,
  type SessionRole,
} from './session/session'

export { CaseNav, type CaseNavLink, type CaseNavProps } from './components/CaseNav'
export {
  CaseHead,
  Layout,
  Shell,
  Stack,
  type CaseHeadProps,
  type LayoutProps,
  type ShellProps,
} from './components/Shell'
export { ReviewNav, type ReviewNavItem, type ReviewNavProps } from './components/ReviewNav'
export {
  Badge,
  Button,
  ButtonRow,
  Callout,
  LinkButton,
  Panel,
  type BadgeProps,
  type BadgeTone,
  type ButtonProps,
  type CalloutProps,
  type CalloutTone,
  type LinkButtonProps,
  type PanelProps,
} from './components/Primitives'
export { Decision, DecisionGrid, type DecisionProps, type DecisionTone } from './components/Decision'
export { DraftCard, type DraftCardProps } from './components/DraftCard'
export {
  AuthorityDialog,
  AuthorityList,
  type Authority,
  type AuthorityJump,
  type AuthorityListProps,
} from './components/AuthorityDialog'
export { SourceThread, type SourceMessage, type SourceThreadProps } from './components/SourceThread'
export {
  Feed,
  type FeedAccent,
  type FeedPost,
  type FeedProps,
  type FeedSource,
} from './components/Feed'
export { ClaimTable, type ClaimTableColumn, type ClaimTableProps } from './components/ClaimTable'
export {
  ActionList,
  DownloadCard,
  DownloadGrid,
  FactCard,
  FactGrid,
  Record,
  StatusStrip,
  type ActionItem,
  type DownloadCardProps,
  type FactCardProps,
  type RecordProps,
  type StatusCellProps,
  type StatusTone,
} from './components/Cards'
