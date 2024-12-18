return {
  {
    "ibhagwan/fzf-lua",
    opts = function(_, opts)
      local actions = require("fzf-lua.actions")
      opts.files = {
        cwd_prompt = false,
        actions = {
          ["ctrl-i"] = { actions.toggle_ignore },
          ["ctrl-h"] = { actions.toggle_hidden },
        },
      }

      opts.grep = {
        actions = {
          ["ctrl-i"] = { actions.toggle_ignore },
          ["ctrl-h"] = { actions.toggle_hidden },
        },
      }
    end,
  },
}
