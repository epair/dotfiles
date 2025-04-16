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

    wiki_link_func = "use_alias_only",

    note_path_func = function(spec)
      local path
      if string.find(tostring(spec.dir), "Fleeting Notes") then
        path = spec.dir / tostring(spec.id)
      else
        path = spec.dir / tostring(spec.title)
      end
      return path:with_suffix(".md")
    end,

    note_frontmatter_func = function(note)
      if string.find(tostring(note.path), "/Fleeting Notes/") then
        note:add_tag("note/fleeting")
      elseif string.find(tostring(note.path), "/Evergreen Notes/") then
        note:add_tag("note/evergreen")
      elseif string.find(tostring(note.path), "/Literature Notes/") then
        note:add_tag("note/literature")
      elseif string.find(tostring(note.path), "/Lists/") then
        note:add_tag("note/list")
      end

      local out = {
        tags = note.tags,
        date = os.date("%Y-%m-%dT%H:%M"),
        last_updated = os.date("%Y-%m-%dT%H:%M"),
      }

      if note.aliases and #note.aliases > 0 then
        out.aliases = note.aliases
      end

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
