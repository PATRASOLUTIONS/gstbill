import type React from "react"
declare module "react-csv" {
  import type { ComponentType, ReactNode } from "react"

  export interface CSVLinkProps {
    data: any[]
    headers?: any[]
    target?: string
    separator?: string
    filename?: string
    uFEFF?: boolean
    enclosingCharacter?: string
    className?: string
    children?: ReactNode
    onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
  }

  export const CSVLink: ComponentType<CSVLinkProps>

  export interface CSVDownloadProps {
    data: any[]
    headers?: any[]
    target?: string
    separator?: string
    filename?: string
    uFEFF?: boolean
    enclosingCharacter?: string
    children?: ReactNode
  }

  export const CSVDownload: ComponentType<CSVDownloadProps>
}

