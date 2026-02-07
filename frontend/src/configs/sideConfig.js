import { MdDashboard, MdEvent, MdListAlt, MdAssessment, MdHomeWork } from "react-icons/md";

const sidebarConfig = [
  {
    icon: MdDashboard,
    label: "Dashboard",
    path: "dashboard",
  },
  {
    icon: MdEvent,
    label: "Booking",
    path: "booking",
  },
  {
    icon: MdListAlt,
    label: "Allocation List",
    path: "allocations",
  },
  {
    icon: MdAssessment,
    label: "Reports",
    path: "reports",
  },
  {
    icon: MdHomeWork,
    label: "Camps",
    path: "camps",
  },
];

export default sidebarConfig;