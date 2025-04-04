return {
  "epwalsh/obsidian.nvim",
  version = "*", -- recommended, use latest release instead of latest commit
  lazy = true,
  ft = "markdown",
  cmd = { "ObsidianToday", "ObsidianTomorrow", "ObsidianDailies" },
  dependencies = {
    "nvim-lua/plenary.nvim", -- Required
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
    workspaces = {
      {
        name = "brain",
        path = "~/Library/Mobile Documents/iCloud~md~obsidian/Documents/brain",
      },
    },
    notes_subdir = "Fleeting Notes",
    daily_notes = {
      -- Optional, if you keep daily notes in a separate directory.
      folder = "Dailies",
      -- Optional, if you want to change the date format for the ID of daily notes.
      date_format = "%Y-%m-%d-%a",
      -- Optional, if you want to change the date format of the default alias of daily notes.
      alias_format = "%a %B %-d, %Y",
      -- Optional, default tags to add to each new daily note created.
      default_tags = { "note/daily" },
      -- Optional, if you want to automatically insert a template from your template directory like 'daily.md'
      -- template = "Daily Note Template",
    },

    -- Optional, for templates (see below).
    templates = {
      folder = "Utilities/templates",
      date_format = "%Y-%m-%dT%H:%M",
      -- time_format = "%H:%M",
      -- -- A map for custom variables, the key should be the variable and the value a function
      -- substitutions = {},
    },

    note_id_func = function(title)
      -- Create note IDs in a Zettelkasten format with a timestamp and a suffix.
      -- In this case a note with the title 'My new note' will be given an ID that looks
      -- like '1657296016-my-new-note', and therefore the file name '1657296016-my-new-note.md'
      local suffix = ""
      if title ~= nil then
        -- If title is given, transform it into valid file name.
        suffix = title:gsub(" ", "-"):gsub("[^A-Za-z0-9-]", ""):lower()
      else
        -- If title is nil, just add 4 random uppercase letters to the suffix.
        for _ = 1, 4 do
          suffix = suffix .. string.char(math.random(65, 90))
        end
      end
      return tostring(os.date("%Y%m%d%H%M%S")) .. "-" .. suffix
    end,

    note_frontmatter_func = function(note)
      -- Example usage
      -- Add the title of the note as an alias.
      if note.title then
        note:add_alias(note.title)
      end

      if string.find(tostring(note.path), "Fleeting") then
        note:add_tag("note/fleeting")
      end

      if string.find(tostring(note.path), "Literature") then
        note:add_tag("note/literature")
      end

      local out = {
        id = note.id,
        aliases = note.aliases,
        tags = note.tags,
        date = os.date("%Y-%m-%dT%H:%M"),
        last_updated = os.date("%Y-%m-%dT%H:%M"),
      }

      -- `note.metadata` contains any manually added fields in the frontmatter.
      -- So here we just make sure those fields are kept in the frontmatter.
      if note.metadata ~= nil and not vim.tbl_isempty(note.metadata) then
        for k, v in pairs(note.metadata) do
          if k ~= "last_updated" then
            out[k] = v
          end
        end
      end

      return out
    end,

    picker = {
      name = "telescope.nvim",
    }
  },
}
