import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createReactRouter,
  createRouteConfig,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import {
  fetchInvoices,
  fetchInvoiceById,
  fetchUsers,
  fetchUserById,
  Invoice,
  postInvoice,
  patchInvoice,
} from './mockTodos'

import { loaderDelayFn } from './utils'
import { z } from 'zod'

//

type UsersViewSortBy = 'name' | 'id' | 'email'

// Build our routes. We could do this in our component, too.
const routeConfig = createRouteConfig().createChildren((createRoute) => [
  createRoute({
    path: '/',
    element: <Home />,
  }),
  createRoute({
    path: 'dashboard',
    element: <Dashboard />,
    loader: async () => {
      console.log('Fetching all invoices...')
      return {
        invoices: await fetchInvoices(),
      }
    },
  }).createChildren((createRoute) => [
    createRoute({ path: '/', element: <DashboardHome /> }),
    createRoute({
      path: 'invoices',
      element: <Invoices />,
    }).createChildren((createRoute) => [
      createRoute({
        path: '/',
        element: <InvoicesHome />,
        action: async (partialInvoice: Partial<Invoice>) => {
          return postInvoice(partialInvoice)
        },
      }),
      createRoute({
        path: ':invoiceId',
        parseParams: (params) => ({
          invoiceId: z.number().int().parse(Number(params.invoiceId)),
        }),
        stringifyParams: ({ invoiceId }) => ({ invoiceId: `${invoiceId}` }),
        validateSearch: z.object({
          showNotes: z.boolean().optional(),
          notes: z.string().optional(),
        }),
        element: <InvoiceView />,
        loader: async ({ params: { invoiceId }, search: {} }) => {
          console.log('Fetching invoice...')
          const invoice = await fetchInvoiceById(invoiceId)

          if (!invoice) {
            throw new Error('Invoice not found!')
          }

          return {
            invoice,
          }
        },
        action: patchInvoice,
      }),
    ]),
    createRoute({
      path: 'users',
      element: <Users />,
      loader: async ({ search }) => {
        search
        return {
          users: await fetchUsers(),
        }
      },
      validateSearch: z.object({
        usersView: z
          .object({
            sortBy: z.enum(['name', 'id', 'email']).optional(),
            filterBy: z.string().optional(),
          })
          .optional(),
      }).parse,
      preSearchFilters: [
        // Persist (or set as default) the usersView search param
        // while navigating within or to this route (or it's children!)
        (search) => ({
          ...search,
          usersView: {
            ...search.usersView,
          },
        }),
      ],
    }).createChildren((createRoute) => [
      createRoute({ path: '/', element: <UsersIndex /> }),
      createRoute({
        path: ':userId',
        parseParams: ({ userId }) => ({ userId: Number(userId) }),
        stringifyParams: ({ userId }) => ({ userId: `${userId}` }),
        element: <UserView />,
        loader: async ({ params: { userId } }) => {
          return {
            user: await fetchUserById(userId),
          }
        },
      }),
    ]),
  ]),
  createRoute({
    // Your elements can be asynchronous, which means you can code-split!
    path: 'expensive',
    element: () =>
      loaderDelayFn(() => import('./Expensive').then((d) => <d.Expensive />)),
  }),
  // Obviously, you can put routes in other files, too
  // reallyExpensiveRoute,
  createRoute({
    path: 'authenticated/', // Trailing slash doesn't mean anything
    element: <Auth />,
  }).createChildren((createRoute) => [
    createRoute({
      path: '/',
      element: <Authenticated />,
    }),
  ]),
  createRoute({
    id: 'layout',
    element: <LayoutWrapper />,
    loader: async () => {
      return loaderDelayFn(() => {
        const rand = Math.random()
        console.log(rand)
        return {
          random: rand,
        }
      })
    },
  }).createChildren((createRoute) => [
    createRoute({
      path: 'layout-a',
      element: <LayoutA />,
    }),
    createRoute({
      path: 'layout-b',
      element: <LayoutB />,
    }),
  ]),
])

const router = createReactRouter({
  routeConfig,
})

// Provide our location and routes to our application
function App() {
  // This stuff is just to tweak our sandbox setup in real-time
  const [loaderDelay, setLoaderDelay] = useSessionStorage('loaderDelay', 500)
  const [actionDelay, setActionDelay] = useSessionStorage('actionDelay', 500)
  const [defaultPendingMs, setDefaultPendingMs] = useSessionStorage(
    'defaultPendingMs',
    2000,
  )
  const [defaultPendingMinMs, setDefaulPendingMinMs] = useSessionStorage(
    'defaultPendingMinMs',
    500,
  )
  const [defaultLoaderMaxAge, setDefaultLoaderMaxAge] = useSessionStorage(
    'defaultLoaderMaxAge',
    5000,
  )
  const [defaultPreloadMaxAge, setDefaultPreloadMaxAge] = useSessionStorage(
    'defaultPreloadMaxAge',
    2000,
  )

  return (
    <>
      {/* More stuff to tweak our sandbox setup in real-time */}
      <div className="text-xs fixed w-52 shadow rounded bottom-2 left-2 bg-white bg-opacity-75 p-2 border-b flex flex-col gap-1 flex-wrap items-left">
        <div>Loader Delay: {loaderDelay}ms</div>
        <div>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={loaderDelay}
            onChange={(e) => setLoaderDelay(e.target.valueAsNumber)}
            className="w-full"
          />
        </div>
        <div>
          Default Pending Ms: {defaultPendingMs}ms{' '}
          {defaultPendingMs > loaderDelay ? <>🔴</> : <>🟢</>}
        </div>
        <div>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={defaultPendingMs}
            onChange={(e) => setDefaultPendingMs(e.target.valueAsNumber)}
            className="w-full"
          />
        </div>
        <div className={`${!defaultPendingMs ? 'opacity-30' : ''}`}>
          <div>Default Min Pending Ms: {defaultPendingMinMs}ms</div>
          <div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={defaultPendingMinMs}
              onChange={(e) => setDefaulPendingMinMs(e.target.valueAsNumber)}
              className={`w-full`}
            />
          </div>
        </div>
        <div>Action Delay: {actionDelay}ms</div>
        <div>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={actionDelay}
            onChange={(e) => setActionDelay(e.target.valueAsNumber)}
            className="w-full"
          />
        </div>
        <div>
          Loader Max Age:{' '}
          {defaultLoaderMaxAge ? `${defaultLoaderMaxAge}ms` : 'Off'}
        </div>
        <div>
          <input
            type="range"
            min="0"
            max="10000"
            step="250"
            value={defaultLoaderMaxAge}
            onChange={(e) => setDefaultLoaderMaxAge(e.target.valueAsNumber)}
            className={`w-full`}
          />
        </div>
        <div>
          Preload Max Age:{' '}
          {defaultPreloadMaxAge ? `${defaultPreloadMaxAge}ms` : 'Off'}
        </div>
        <div>
          <input
            type="range"
            min="0"
            max="10000"
            step="250"
            value={defaultPreloadMaxAge}
            onChange={(e) => setDefaultPreloadMaxAge(e.target.valueAsNumber)}
            className={`w-full`}
          />
        </div>
      </div>
      {/* Normally <Router /> matches and renders our
      routes, but when we pass our own children, we can use
      <Outlet /> to start rendering our matches when we're
      // ready. This also let's us use router API's
      in <Root /> before rendering any routes */}
      <AuthProvider>
        <RouterProvider
          router={router}
          defaultPendingElement={
            <div className={`p-2 text-2xl`}>
              <Spinner />
            </div>
          }
          defaultPreload="intent"
          defaultLoaderMaxAge={defaultLoaderMaxAge}
          defaultPreloadMaxAge={defaultPreloadMaxAge}
          defaultPendingMs={defaultPendingMs}
          defaultPendingMinMs={defaultPendingMinMs}
          // defaultLoaderMaxAge={5 * 1000}
          // defaultLoaderGcMaxAge={10 * 1000}
          // Normally, the options above aren't changing, but for this particular
          // example, we need to key the router when they change
          key={[
            defaultPreloadMaxAge,
            defaultPendingMs,
            defaultPendingMinMs,
          ].join('.')}
        >
          <Root />
        </RouterProvider>
      </AuthProvider>
      <TanStackRouterDevtools router={router} position="bottom-right" />
    </>
  )
}

function Root() {
  const routerState = router.useState()

  return (
    <div className={`min-h-screen flex flex-col`}>
      <div className={`flex items-center border-b gap-2`}>
        <h1 className={`text-3xl p-2`}>Kitchen Sink</h1>
        {/* Show a global spinner when the router is transitioning */}
        <div
          className={`text-3xl duration-300 delay-0 opacity-0 ${
            routerState.isFetching ? ` duration-1000 opacity-40` : ''
          }`}
        >
          <Spinner />
        </div>
      </div>
      <div className={`flex-1 flex`}>
        <div className={`divide-y w-56`}>
          {(
            [
              ['.', 'Home'],
              ['/dashboard', 'Dashboard'],
              ['/expensive', 'Expensive'],
              ['/authenticated', 'Authenticated'],
              ['/layout-a', 'Layout A'],
              ['/layout-b', 'Layout B'],
            ] as const
          ).map(([to, label]) => {
            return (
              <div key={to}>
                <router.Link
                  to={to}
                  activeOptions={
                    {
                      // If the route points to the root of it's parent,
                      // make sure it's only active if it's exact
                      // exact: to === '.',
                    }
                  }
                  preload="intent"
                  className={`block py-2 px-3 text-blue-700`}
                  // Make "active" links bold
                  activeProps={{ className: `font-bold` }}
                >
                  {label}
                </router.Link>
              </div>
            )
          })}
        </div>
        <div className={`flex-1 border-l border-gray-200`}>
          {/* Render our first route match */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function Home() {
  const route = router.useMatch('/')

  return (
    <div className={`p-2`}>
      <div className={`text-lg`}>Welcome Home!</div>
      <hr className={`my-2`} />
      <route.Link
        to="/dashboard/invoices/:invoiceId"
        params={{
          invoiceId: 3,
        }}
        className={`py-1 px-2 text-xs bg-blue-500 text-white rounded-full`}
      >
        1 New Invoice
      </route.Link>
      <hr className={`my-2`} />
      <div className={`max-w-xl`}>
        As you navigate around take note of the UX. It should feel
        suspense-like, where routes are only rendered once all of their data and
        elements are ready.
        <hr className={`my-2`} />
        To exaggerate async effects, play with the artificial request delay
        slider in the bottom-left corner. You can also play with the default
        timings for displaying the pending fallbacks and the minimum time any
        pending fallbacks will remain shown.
        <hr className={`my-2`} />
        The last 2 sliders determine if link-hover preloading is enabled (and
        how long those preloads stick around) and also whether to cache rendered
        route data (and for how long). Both of these default to 0 (or off).
      </div>
    </div>
  )
}

function Dashboard() {
  const route = router.useMatch('/dashboard')

  return (
    <>
      <div className="flex items-center border-b">
        <h2 className="text-xl p-2">Dashboard</h2>
        <route.Link
          to="/dashboard/invoices/:invoiceId"
          params={{
            invoiceId: 3,
          }}
          className="py-1 px-2 text-xs bg-blue-500 text-white rounded-full"
        >
          1 New Invoice
        </route.Link>
      </div>
      <div className="flex flex-wrap divide-x">
        {(
          [
            ['.', 'Summary'],
            ['/dashboard/invoices', 'Invoices'],
            ['/dashboard/users', 'Users', true],
          ] as const
        ).map(([to, label, search]) => {
          return (
            <route.Link
              key={to}
              to={to}
              search={search}
              activeOptions={{ exact: to === '.' }}
              activeProps={{ className: `font-bold` }}
              className="p-2"
            >
              {label}
            </route.Link>
          )
        })}
      </div>
      <hr />
      <Outlet />
    </>
  )
}

function DashboardHome() {
  const {
    loaderData: { invoices },
  } = router.useMatch('/dashboard/')

  return (
    <div className="p-2">
      <div className="p-2">
        Welcome to the dashboard! You have{' '}
        <strong>{invoices.length} total invoices</strong>.
      </div>
    </div>
  )
}

function Invoices() {
  const {
    loaderData: { invoices },
    Link,
    MatchRoute,
  } = router.useMatch('/dashboard/invoices')

  // Get the action for a child route
  const invoiceIndexMatch = router.useMatch('/dashboard/invoices/', {
    strict: false,
  })

  const invoiceDetailMatch = router.useMatch('/dashboard/invoices/:invoiceId', {
    strict: false,
  })

  return (
    <div className="flex-1 flex">
      <div className="divide-y w-48">
        {invoices?.map((invoice) => {
          const foundPending = invoiceDetailMatch?.action.submissions.find(
            (d) => d.submission?.id === invoice.id,
          )

          if (foundPending?.submission) {
            invoice = { ...invoice, ...foundPending.submission }
          }

          return (
            <div key={invoice.id}>
              <Link
                to="/dashboard/invoices/:invoiceId"
                params={{
                  invoiceId: invoice.id,
                }}
                preload="intent"
                className="block py-2 px-3 text-blue-700"
                activeProps={{ className: `font-bold` }}
              >
                <pre className="text-sm">
                  #{invoice.id} - {invoice.title.slice(0, 10)}{' '}
                  {foundPending ? (
                    <Spinner />
                  ) : (
                    <MatchRoute
                      to="./:invoiceId"
                      params={{
                        invoiceId: invoice.id,
                      }}
                      pending
                    >
                      <Spinner />
                    </MatchRoute>
                  )}
                </pre>
              </Link>
            </div>
          )
        })}
        {invoiceIndexMatch?.action.submissions.map((action) => (
          <div key={action.submittedAt}>
            <a href="#" className="block py-2 px-3 text-blue-700">
              <pre className="text-sm">
                #<Spinner /> - {action.submission.title?.slice(0, 10)}
              </pre>
            </a>
          </div>
        ))}
      </div>
      <div className="flex-1 border-l border-gray-200">
        <Outlet />
      </div>
    </div>
  )
}

function InvoicesHome() {
  const { action } = router.useMatch('/dashboard/invoices/')

  return (
    <>
      <div className="p-2">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            const formData = new FormData(event.target as HTMLFormElement)
            action.submit(
              {
                title: formData.get('title') as string,
                body: formData.get('body') as string,
              },
              { multi: true },
            )
          }}
          className="space-y-2"
        >
          <div>Create a new Invoice:</div>
          <InvoiceFields invoice={{} as Invoice} />
          <div>
            <button
              className="bg-blue-500 rounded p-2 uppercase text-white font-black disabled:opacity-50"
              // disabled={action.current?.status === 'pending'}
            >
              Create
            </button>
          </div>
          {action.current?.status === 'success' ? (
            <div className="inline-block px-2 py-1 rounded bg-green-500 text-white animate-bounce [animation-iteration-count:2.5] [animation-duration:.3s]">
              Created!
            </div>
          ) : action.current?.status === 'error' ? (
            <div className="inline-block px-2 py-1 rounded bg-red-500 text-white animate-bounce [animation-iteration-count:2.5] [animation-duration:.3s]">
              Failed to create.
            </div>
          ) : null}
        </form>
      </div>
    </>
  )
}

function InvoiceView() {
  const {
    loaderData: { invoice },
    action,
    search,
    Link,
    navigate,
  } = router.useMatch('/dashboard/invoices/:invoiceId')

  const [notes, setNotes] = React.useState(search.notes ?? ``)

  React.useEffect(() => {
    navigate({
      search: (old) => ({ ...old, notes: notes ? notes : undefined }),
      replace: true,
    })
  }, [notes])

  return (
    <form
      key={invoice.id}
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const formData = new FormData(event.target as HTMLFormElement)
        action.submit({
          id: invoice.id,
          title: formData.get('title') as string,
          body: formData.get('body') as string,
        })
      }}
      className="p-2 space-y-2"
    >
      <InvoiceFields
        invoice={invoice}
        disabled={action.current?.status === 'pending'}
      />
      <div>
        <Link
          search={(old) => ({
            ...old,
            showNotes: old?.showNotes ? undefined : true,
          })}
          className="text-blue-700"
        >
          {search.showNotes ? 'Close Notes' : 'Show Notes'}{' '}
        </Link>
        {search.showNotes ? (
          <>
            <div>
              <div className="h-2" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="shadow w-full p-2 rounded"
                placeholder="Write some notes here..."
              />
              <div className="italic text-xs">
                Notes are stored in the URL. Try copying the URL into a new tab!
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div>
        <button
          className="bg-blue-500 rounded p-2 uppercase text-white font-black disabled:opacity-50"
          disabled={action.current?.status === 'pending'}
        >
          Save
        </button>
      </div>
      <div key={action.current?.submittedAt}>
        {action.current?.status === 'success' ? (
          <div className="inline-block px-2 py-1 rounded bg-green-500 text-white animate-bounce [animation-iteration-count:2.5] [animation-duration:.3s]">
            Saved!
          </div>
        ) : action.current?.status === 'error' ? (
          <div className="inline-block px-2 py-1 rounded bg-red-500 text-white animate-bounce [animation-iteration-count:2.5] [animation-duration:.3s]">
            Failed to save.
          </div>
        ) : null}
      </div>
    </form>
  )
}

function InvoiceFields({
  invoice,
  disabled,
}: {
  invoice: Invoice
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <h2 className="font-bold text-lg">
        <input
          name="title"
          defaultValue={invoice?.title}
          placeholder="Invoice Title"
          className="border border-opacity-50 rounded p-2 w-full"
          disabled={disabled}
        />
      </h2>
      <div>
        <textarea
          name="body"
          defaultValue={invoice?.body}
          rows={6}
          placeholder="Invoice Body..."
          className="border border-opacity-50 p-2 rounded w-full"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function Users() {
  const {
    loaderData: { users },
    search: { usersView },
    Link,
    MatchRoute,
    navigate,
  } = router.useMatch('/dashboard/users')

  const sortBy = usersView?.sortBy ?? 'name'
  const filterBy = usersView?.filterBy

  const [filterDraft, setFilterDraft] = React.useState(filterBy ?? '')

  const sortedUsers = React.useMemo(() => {
    if (!users) return []

    return !sortBy
      ? users
      : [...users].sort((a, b) => {
          return a[sortBy] > b[sortBy] ? 1 : -1
        })
  }, [users, sortBy])

  const filteredUsers = React.useMemo(() => {
    if (!filterBy) return sortedUsers

    return sortedUsers.filter((user) =>
      user.name.toLowerCase().includes(filterBy.toLowerCase()),
    )
  }, [sortedUsers, filterBy])

  const setSortBy = (sortBy: UsersViewSortBy) =>
    navigate({
      search: (old) => {
        return {
          ...old,
          usersView: {
            ...(old?.usersView ?? {}),
            sortBy,
          },
        }
      },
      replace: true,
    })

  React.useEffect(() => {
    navigate({
      search: (old) => {
        return {
          ...old,
          usersView: {
            ...old?.usersView,
            filterBy: filterDraft || undefined,
          },
        }
      },
      replace: true,
    })
  }, [filterDraft])

  return (
    <div className="flex-1 flex">
      <div className="divide-y">
        <div className="py-2 px-3 flex gap-2 items-center bg-gray-100">
          <div>Sort By:</div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as UsersViewSortBy)}
            className="flex-1 border p-1 px-2 rounded"
          >
            {['name', 'id', 'email'].map((d) => {
              return <option key={d} value={d} children={d} />
            })}
          </select>
        </div>
        <div className="py-2 px-3 flex gap-2 items-center bg-gray-100">
          <div>Filter By:</div>
          <input
            value={filterDraft}
            onChange={(e) => setFilterDraft(e.target.value)}
            placeholder="Search Names..."
            className="min-w-0 flex-1 border p-1 px-2 rounded"
          />
        </div>
        {filteredUsers?.map((user) => {
          return (
            <div key={user.id}>
              <Link
                to="./:userId"
                params={{
                  userId: user.id,
                }}
                className="block py-2 px-3 text-blue-700"
                activeProps={{ className: `font-bold` }}
              >
                <pre className="text-sm">
                  {user.name}{' '}
                  <MatchRoute
                    to={`./:userId`}
                    params={{
                      userId: user.id,
                    }}
                    pending
                  >
                    <Spinner />
                  </MatchRoute>
                </pre>
              </Link>
            </div>
          )
        })}
      </div>
      <div className="flex-initial border-l border-gray-200">
        <Outlet />
      </div>
    </div>
  )
}

function UsersIndex() {
  return (
    <div className="p-2 space-y-2">
      <p>
        Normally, setting default search parameters would either need to be done
        manually in every link to a page, or as a side-effect (not a great
        experience).
      </p>
      <p>
        Instead, we can use <strong>search filters</strong> to provide defaults
        or even persist search params for links to routes (and child routes).
      </p>
      <p>
        A good example of this is the sorting and filtering of the users list.
        In a traditional router, both would be lost while navigating around
        individual users or even changing each sort/filter option unless each
        state was manually passed from the current route into each new link we
        created (that's a lot of tedious and error-prone work). With TanStack
        router and search filters, they are persisted with little effort.
      </p>
    </div>
  )
}

function UserView() {
  const {
    loaderData: { user },
  } = router.useMatch('/dashboard/users/:userId')

  return (
    <>
      <h4 className="p-2 font-bold">{user?.name}</h4>
      <pre className="text-sm whitespace-pre-wrap">
        {JSON.stringify(user, null, 2)}
      </pre>
    </>
  )
}

type AuthContext = {
  login: (username: string) => void
  logout: () => void
} & AuthContextState

type AuthContextState = {
  status: 'loggedOut' | 'loggedIn'
  username?: string
}

const AuthContext = React.createContext<AuthContext>(null!)

function AuthProvider(props: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthContextState>({
    status: 'loggedOut',
  })

  const login = (username: string) => {
    setState({ status: 'loggedIn', username })
  }

  const logout = () => {
    setState({ status: 'loggedOut' })
  }

  const contextValue = React.useMemo(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state],
  )

  return <AuthContext.Provider value={contextValue} children={props.children} />
}

function useAuth() {
  return React.useContext(AuthContext)
}

function Auth() {
  const auth = useAuth()
  const [username, setUsername] = React.useState('')

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    auth.login(username)
  }

  return auth.status === 'loggedIn' ? (
    <Outlet />
  ) : (
    <div className="p-2">
      <div>You must log in!</div>
      <div className="h-2" />
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border p-1 px-2 rounded"
        />
        <button
          onClick={() => auth.logout()}
          className="text-sm bg-blue-500 text-white border inline-block py-1 px-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  )
}

function Authenticated() {
  const auth = useAuth()

  return (
    <div className="p-2">
      You're authenticated! Your username is <strong>{auth.username}</strong>
      <div className="h-2" />
      <button
        onClick={() => auth.logout()}
        className="text-sm bg-blue-500 text-white border inline-block py-1 px-2 rounded"
      >
        Log out
      </button>
      <div className="h-2" />
      <div>
        This authentication example is obviously very contrived and simple. It
        doesn't cover the use case of a redirected login page, but does
        illustrate how easy it is to simply wrap routes with ternary logic to
        either show a login prompt or redirect (probably with the `Navigate`
        component).
      </div>
    </div>
  )
}

function LayoutWrapper() {
  const { loaderData } = router.useMatch('/layout')

  return (
    <div>
      <div>Layout</div>
      <div>Random #: {loaderData.random}</div>
      <hr />
      <Outlet />
    </div>
  )
}

function LayoutA() {
  return (
    <div>
      <div>Layout A</div>
    </div>
  )
}
function LayoutB() {
  return (
    <div>
      <div>Layout B</div>
    </div>
  )
}

function Spinner() {
  return <div className="inline-block animate-spin px-3">⍥</div>
}

function useSessionStorage<T>(key: string, initialValue: T) {
  const state = React.useState<T>(() => {
    const stored = sessionStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  React.useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state[0]))
  }, [state[0]])

  return state
}

const rootElement = document.getElementById('app')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<App />)
}
