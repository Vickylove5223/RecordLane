import { c as createLucideIcon, j as jsxRuntimeExports, g as cn } from "./index-C3SkEJPH.js";
/**
 * @license lucide-react v0.484.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z", key: "p7xjir" }]
];
const Cloud = createLucideIcon("cloud", __iconNode$1);
/**
 * @license lucide-react v0.484.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Settings = createLucideIcon("settings", __iconNode);
function ModernCard({
  children,
  className,
  variant = "default",
  onClick
}) {
  const baseClasses = "rounded-xl transition-all duration-200 cursor-pointer";
  const variantClasses = {
    default: "bg-white border border-gray-200 shadow-sm hover:shadow-md",
    layered: "bg-white border border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1",
    highlighted: "bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 shadow-md hover:shadow-lg",
    document: "bg-white border border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 relative overflow-hidden"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn(
        baseClasses,
        variantClasses[variant],
        onClick && "hover:scale-[1.02]",
        className
      ),
      onClick,
      children
    }
  );
}
function GridCard({ children, className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6", className), children });
}
export {
  Cloud as C,
  GridCard as G,
  ModernCard as M,
  Settings as S
};
