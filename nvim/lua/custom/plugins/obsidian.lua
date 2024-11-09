return {
  'epwalsh/obsidian.nvim',
  version = '*', -- recommended, use latest release instead of latest commit
  lazy = true,
  ft = 'markdown',
  cmd = { 'ObsidianToday', 'ObsidianTomorrow', 'ObsidianDailies' },
  -- Replace the above line with this if you only want to load obsidian.nvim for markdown files in your vault:
  -- event = {
  --   -- If you want to use the home shortcut '~' here you need to call 'vim.fn.expand'.
  --   -- E.g. "BufReadPre " .. vim.fn.expand "~" .. "/my-vault/*.md"
  --   -- refer to `:h file-pattern` for more examples
  --   "BufReadPre path/to/my-vault/*.md",
  --   "BufNewFile path/to/my-vault/*.md",
  -- },
  dependencies = {
    'nvim-lua/plenary.nvim', -- Required
    'hrsh7th/nvim-cmp',
    'nvim-treesitter/nvim-treesitter',
    'nvim-telescope/telescope.nvim',
  },
  keys = {
    { '<leader>ot', ':ObsidianToday<CR>', desc = "[O]bsidian [T]oday's note" },
    { '<leader>om', ':ObsidianTomorrow<CR>', desc = "[O]bsidian (to)[M]orrow's note" },
    { '<leader>od', ':ObsidianDailies<CR>', desc = '[O]bsidian [D]ailies notes' },
    { '<leader>on', ':ObsidianNew<CR>', desc = '[O]bsidian [N]ew note' },
    { '<leader>os', ':ObsidianSearch<CR>', desc = '[O]bsidian [S]earch' },
    { '<leader>oq', ':ObsidianQuickSwitch<CR>', desc = '[O]bsidian [Q]uick switch' },
  },
  opts = {
    workspaces = {
      {
        name = 'brain',
        path = '~/Documents/Obsidian Vault',
      },
    },
    daily_notes = {
      -- Optional, if you keep daily notes in a separate directory.
      folder = '01 Dailies',
      -- Optional, if you want to change the date format for the ID of daily notes.
      date_format = '%Y-%m-%d %a',
      -- Optional, if you want to change the date format of the default alias of daily notes.
      -- alias_format = "%B %-d, %Y",
      -- Optional, default tags to add to each new daily note created.
      default_tags = {},
      -- Optional, if you want to automatically insert a template from your template directory like 'daily.md'
      template = 'Daily Note Template',
    },

    -- Optional, for templates (see below).
    templates = {
      folder = '06 Utilities/templates',
      -- date_format = "%Y-%m-%d",
      -- time_format = "%H:%M",
      -- -- A map for custom variables, the key should be the variable and the value a function
      -- substitutions = {},
    },

    picker = {
      name = 'telescope.nvim',
    },
  },
}
