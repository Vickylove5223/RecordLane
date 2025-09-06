import { c as createLucideIcon, w as useNavigate, v as useYouTube, j as jsxRuntimeExports, B as Button, T as TriangleAlert, R as RefreshCw } from "./index-C3SkEJPH.js";
import { S as Settings, M as ModernCard, C as Cloud } from "./modern-card-B86KsHwS.js";
import { A as ArrowLeft } from "./arrow-left-BYgRD7iI.js";
import { E as ExternalLink } from "./external-link-B-Bz-w0c.js";
/**
 * @license lucide-react v0.484.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" }],
  ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }]
];
const CreditCard = createLucideIcon("credit-card", __iconNode);
function YouTubeSetupPage() {
  const navigate = useNavigate();
  const { connectYouTube, isConnected, isConnecting, userEmail } = useYouTube();
  const steps = [
    {
      title: "Go to Google Cloud Console",
      description: "Create a new project or select an existing one.",
      link: "https://console.cloud.google.com/"
    },
    {
      title: "Enable YouTube Data API v3",
      description: 'In "APIs & Services" > "Library", find and enable the YouTube Data API.'
    },
    {
      title: "Create OAuth 2.0 Credentials",
      description: 'Create a "Web application" OAuth client ID. Add the authorized redirect URIs provided in your Encore/Leap dashboard.'
    },
    {
      title: "Set Encore Secrets",
      description: 'In your Encore/Leap dashboard, go to the "Infrastructure" tab and set the `GoogleClientID` and `GoogleClientSecret` secrets.'
    },
    {
      title: "Connect Your Account",
      description: "Once the secrets are set, come back here and connect your account."
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-4xl mx-auto px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => navigate("/"),
          className: "text-gray-600 hover:text-gray-900",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Back to App" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Back" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-px bg-gray-300 hidden sm:block" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-5 w-5 text-gray-700" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg sm:text-xl font-semibold text-gray-900", children: "YouTube Integration Setup" })
      ] })
    ] }) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ModernCard, { variant: "layered", className: "p-4 sm:p-6 lg:p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 sm:mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl sm:text-2xl font-bold text-gray-900 mb-2", children: "Setup Guide" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base sm:text-lg text-gray-600", children: "Follow these steps to connect RecordLane to your YouTube account. This is a one-time setup." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: steps.map((step, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600", children: index + 1 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-gray-900", children: step.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: step.description }),
            step.link && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "a",
              {
                href: step.link,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-sm text-blue-600 hover:underline inline-flex items-center mt-1",
                children: [
                  "Go to Google Cloud Console ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3 ml-1" })
                ]
              }
            )
          ] })
        ] }, index)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(ModernCard, { variant: "layered", className: "p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-6 w-6 text-amber-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Troubleshooting" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-600", children: "Having issues with the setup? Here are common problems and solutions." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-l-4 border-amber-200 bg-amber-50 p-4 rounded-r-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-5 w-5 text-amber-600 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-amber-800", children: "Google Cloud Console Billing Issue" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-700 mt-1", children: "If you're getting billing errors or API quota issues:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-amber-700 mt-2 space-y-1 ml-4 list-disc", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Make sure billing is enabled for your Google Cloud project" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Check if you have exceeded the free tier quota for YouTube Data API" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Verify your payment method is valid and up to date" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Wait 24 hours if you just enabled billing (it can take time to activate)" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-l-4 border-blue-200 bg-blue-50 p-4 rounded-r-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-5 w-5 text-blue-600 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-blue-800", children: "OAuth Credentials Not Working" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-700 mt-1", children: "If you're having trouble with OAuth setup:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Double-check the redirect URIs match exactly (including https://)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Ensure the OAuth consent screen is configured properly" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Make sure the client ID and secret are copied correctly (no extra spaces)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Verify the YouTube Data API v3 is enabled in your project" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-l-4 border-purple-200 bg-purple-50 p-4 rounded-r-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Cloud, { className: "h-5 w-5 text-purple-600 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-purple-800", children: "Encore Secrets Not Working" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-purple-700 mt-1", children: "If your secrets aren't being recognized:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-purple-700 mt-2 space-y-1 ml-4 list-disc", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Check that secrets are set for the correct environment (dev/prod)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                  "Ensure secret names match exactly: ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-purple-100 px-1 rounded", children: "GoogleClientID" }),
                  " and ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-purple-100 px-1 rounded", children: "GoogleClientSecret" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Try redeploying your Encore app after setting secrets" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Verify the backend server is running and accessible" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-l-4 border-red-200 bg-red-50 p-4 rounded-r-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-5 w-5 text-red-600 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-red-800", children: "Still Having Issues?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700 mt-1", children: "If nothing above helps:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-red-700 mt-2 space-y-1 ml-4 list-disc", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Clear your browser cache and cookies" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Try using an incognito/private browsing window" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Check your internet connection and firewall settings" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Contact support if the problem persists" })
              ] })
            ] })
          ] }) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  YouTubeSetupPage as default
};
