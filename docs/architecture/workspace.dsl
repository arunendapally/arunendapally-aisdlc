workspace "Product" "C4 model as code. Change it in the same PR as the system." {

    model {
        user = person "User" "Uses the product."
        engineer = person "Engineer" "Approves gates and merges."
        builder = person "Builder agent" "Writes code on feature branches only. No production credentials." "Agent"

        product = softwareSystem "Product" "What we build." {
            web = container "Web app" "User interface." "TypeScript" {
                properties {
                    "source" "apps/web"
                }
            }
            api = container "API" "Business logic." "TypeScript" {
                properties {
                    "source" "services/api"
                }
            }
            db = container "Database" "System of record." "PostgreSQL" "Database"
        }
        github = softwareSystem "GitHub" "Code, reviews, CI and rulesets." "External"

        user -> web "Uses" "HTTPS"
        web -> api "Calls" "JSON/HTTPS"
        api -> db "Reads and writes" "SQL"
        builder -> github "Pushes feature branches and opens draft PRs" "GitHub App"
        engineer -> github "Reviews, approves and merges"
    }

    views {
        systemContext product "Context" {
            include *
            autolayout lr
        }
        container product "Containers" {
            include *
            autolayout lr
        }
        styles {
            element "Agent" {
                background #8a5cf6
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Database" {
                shape cylinder
            }
        }
    }
}
