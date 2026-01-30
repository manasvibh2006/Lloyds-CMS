import { MdDashboard } from "react-icons/md";
import { FaBuilding, FaBed } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { RiFileList3Line } from "react-icons/ri";
import { BsClipboardCheck } from "react-icons/bs";

export const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: <MdDashboard /> },
  { key: "block", label: "Block", icon: <FaBuilding /> },
  { key: "room", label: "Room Details", icon: <FaBed /> },
  { key: "Book", label: "Bookings", icon: <FaBed /> },
  { key: "amenities", label: "Amenities", icon: <BsClipboardCheck /> },
  { key: "guest", label: "Guest", icon: <HiUsers /> },
  { key: "allocation", label: "Allocation List", icon: <RiFileList3Line /> },
  { key: "reports", label: "Reports", icon: <RiFileList3Line /> }
];
