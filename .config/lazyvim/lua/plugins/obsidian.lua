return {
  "epwalsh/obsidian.nvim",
  version = "*", -- recommended, use latest release instead of latest commit
  lazy = true,
  ft = "markdown",
  cmd = { "ObsidianToday", "ObsidianTomorrow", "ObsidianDailies" },
  dependencies = {
    "nvim-lua/plenary.nvim", -- Required
    "hrsh7th/nvim-cmp",
    "nvim-treesitter/nvim-treesitter",
    "nvim-telescope/telescope.nvim",
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
    -- note_frontmatter_func = function(note)
    --   -- Add the title of the note as an alias.
    --   if note.title then
    --     note:add_alias(note.title)
    --   end
    --
    --   local out = { id = note.id, aliases = note.aliases, tags = note.tags }
    --
    --   -- `note.metadata` contains any manually added fields in the frontmatter.
    --   -- So here we just make sure those fields are kept in the frontmatter.
    --   if note.metadata ~= nil and not vim.tbl_isempty(note.metadata) then
    --     for k, v in pairs(note.metadata) do
    --       out[k] = v
    --     end
    --   end
    --
    --   return out
    -- end,
    workspaces = {
      {
        name = "brain",
        path = "~/Documents/Obsidian Vault",
      },
    },
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

    picker = {
      name = "telescope.nvim",
    },
  },
}