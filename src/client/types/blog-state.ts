import { Page } from "./PageType"
import { BlogConfig } from "./blog-config"

export type BlogState = {
    pages: Page[]
    config: BlogConfig
}