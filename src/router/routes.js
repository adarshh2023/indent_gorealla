const routes = [
  // Public routes (no authentication required)
  {
    path: "/test",
    name: "test",
    component: () => import("src/pages/TestPage.vue"),
    meta: {
      requiresAuth: false,
      guestOnly: true,
      title: "Test - Gorealla Developer",
    },
  },

  {
    path: "",
    name: "login",
    component: () => import("pages/LoginPage.vue"),
    meta: {
      requiresAuth: false,
      guestOnly: true,
      title: "Login - Gorealla Developer",
    },
  },

  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("pages/ForgotPasswordPage.vue"),
    meta: {
      requiresAuth: false,
      guestOnly: true,
      title: "Forgot Password - Gorealla Developer",
    },
  },
  {
    path: "/login-otp",
    name: "login-otp",
    component: () => import("pages/LoginOTPPage.vue"),
    meta: {
      requiresAuth: false,
      guestOnly: true,
      title: "Login with OTP - Gorealla Developer",
    },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("pages/RegisterPage.vue"),
    meta: {
      requiresAuth: false,
      guestOnly: true,
      title: "Create Account - Gorealla Developer",
    },
  },

  {
    path: "/menu",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("pages/DashboardPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Dashboard - Gorealla Developer",
        },
      },

      // Project Management Routes
      {
        path: "projects/tree-view",
        name: "projectTreeView",
        component: () => import("pages/tree/EnhancedProjectNodeTree.vue"),
        props: (route) => ({
          initialProjectId: route.query.project || null,
          initialNodeId: route.query.node || null,
          initialTab: route.query.tab || null,
        }),
        meta: {
          requiresAuth: true,
          title: "Project Tree View - Gorealla Developer",
        },
      },
      {
        path: "projects/column-view",
        name: "projectColumnView",
        component: () => import("pages/tree/EnhancedProjectColumnViewDD.vue"),
        props: (route) => ({
          initialProjectId: route.query.project || null,
          initialNodeId: route.query.node || null,
          initialTab: route.query.tab || null,
        }),
        meta: {
          requiresAuth: true,
          title: "Project Column View - Gorealla Developer",
        },
      },
      {
        path: "projects/bulk-update-view",
        name: "bulkNodeManagement",
        component: () => import("pages/tree/BulkNodeManagement.vue"),
        meta: {
          requiresAuth: true,
          title: "Bulk Node Management - Gorealla Developer",
        },
      },
      {
        path: "projects/all-media",
        name: "allMedia",
        component: () => import("pages/AllMediaPage.vue"),
        props: (route) => ({
          initialProjectId: route.query.project || null,
        }),
        meta: {
          requiresAuth: true,
          title: "All Media - Gorealla Developer",
        },
      },

      // Vendor Management Routes
      {
        path: "vendors",
        name: "vendorManagement",
        component: () => import("pages/masters/VendorManagementPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Vendor Management - Gorealla Developer",
        },
      },

      {
        path: "indent",
        name: "indentManagement",
        component: () => import("pages/IndentManagementPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Indent Management - Gorealla Developer",
        },
      },

      // Item Category Management Routes
      {
        path: "itemCategories",
        name: "itemCategoryManagement",
        component: () => import("pages/masters/ItemCategoriesManagementPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Item Category Management - Gorealla Developer",
        },
      },

      // Units Management Routes
      {
        path: "units",
        name: "unitManagement",
        component: () => import("pages/masters/UnitManagementPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Unit Management - Gorealla Developer",
        },
      },

      // Item Management Routes
      {
        path: "items",
        name: "itemManagement",
        component: () => import("pages/masters/ItemsManagementPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Item Management - Gorealla Developer",
        },
      },

      // Vendor Management Routes
      {
        path: "vendors",
        name: "vendorManagement",
        component: () => import("pages/masters/VendorManagementPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Vendor Management - Gorealla Developer",
        },
      },

      // Location Management Routes
      {
        path: "locations",
        name: "locationManagement",
        component: () => import("pages/masters/LocationManagementPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Location Management - Gorealla Developer",
        },
      },

      // Notification Routes
      {
        path: "notifications",
        name: "notifications",
        component: () => import("pages/notifications/NotificationsPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Notifications - Gorealla Developer",
        },
      },
      {
        path: "notifications/settings",
        name: "notificationSettings",
        component: () =>
          import("pages/notifications/NotificationSettingsPage.vue"),
        meta: {
          requiresAuth: true,
          title: "Notification Settings - Gorealla Developer",
        },
      },
    ],
    meta: {
      requiresAuth: true,
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
    meta: {
      title: "Page Not Found - Gorealla Developer",
    },
  },
];

export default routes;
