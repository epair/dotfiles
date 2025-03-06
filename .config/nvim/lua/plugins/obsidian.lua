return {
  "epwalsh/obsidian.nvim",
  version = "*", -- recommended, use latest release instead of latest commit
  lazy = true,
  ft = "markdown",
  cmd = { "ObsidianToday", "ObsidianTomorrow", "ObsidianDailies" },
  dependencies = {
    "nvim-lua/plenary.nvim", -- Required
    "nvim-treesitter/nvim-treesitter",
    "ibhagwan/fzf-lua",
  },
  keys = {
    { "<leader>ot", ":ObsidianToday<CR>", desc = "Today's note" },
    { "<leader>om", ":ObsidianTomorrow<CR>", desc = "Tomorrow's note" },
    { "<leader>od", ":ObsidianDailies<CR>", desc = "Dailies notes" },
    { "<leader>on", ":ObsidianNew<CR>", desc = "New note" },
    { "<leader>os", ":ObsidianSearch<CR>", desc = "Search notes" },
    { "<leader>oq", ":ObsidianQuickSwitch<CR>", desc = "Quick switch" },
  },
  opts = {
    workspaces = {
      {
        name = "brain",
        path = "~/personal/brain",
      },
    },
    notes_subdir = "02 Fleeting Notes",
    daily_notes = {
      -- Optional, if you keep daily notes in a separate directory.
      folder = "01 Dailies",
      -- Optional, if you want to change the date format for the ID of daily notes.
      date_format = "%Y-%m-%d %a",
      -- Optional, if you want to change the date format of the default alias of daily notes.
      -- alias_format = "%B %-d, %Y",
      -- Optional, default tags to add to each new daily note created.
      default_tags = {},
      -- Optional, if you want to automatically insert a template from your template directory like 'daily.md'
      template = "Daily Note Template",
    },

    -- Optional, for templates (see below).
    templates = {
      folder = "06 Utilities/templates",
      -- date_format = "%Y-%m-%d",
      -- time_format = "%H:%M",
      -- -- A map for custom variables, the key should be the variable and the value a function
      -- substitutions = {},
    },

    note_id_func = function(title)
      return os.date("%Y%m%d%H%M%S") .. " " .. title
    end,

    picker = {
      name = "fzf-lua",
    },
    disable_frontmatter = true,
  },
}
