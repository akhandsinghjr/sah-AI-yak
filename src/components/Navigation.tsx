
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";

const Navigation = () => {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center md:justify-center items-center p-4">
          <ul className="flex space-x-6">
            <li>
              <NavLink
                to="/chat"
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </NavLink>
            </li>
            <li>
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) => cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </NavLink>
              </li>
              <ModeToggle />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
