"use client"

import Link from "next/link"
import { FC } from "react"
import { ChatbotUISVG } from "../icons/chatbotui-svg"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <Link
      className="flex cursor-pointer flex-col items-center hover:opacity-50"
      href="https://www.tuonlineresources.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
         <img src="https://tuonlineresources.com/images/GAI/TU-256-icon.png" alt="TU Chatbot UI" />
      </div>

      <div className="text-4xl font-bold tracking-wide">TU Chatbot UI</div>
    </Link>
  )
}
