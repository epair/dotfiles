return {
  "folke/which-key.nvim",
  event = "VeryLazy",
  opts = {
    delay = 3000,
    spec = {
      { "<leader>o", group = "obsidian", icon = { icon = "󰠮 " } },
      { "<leader>t", group = "neotest", icon = { icon = " " } },
      { "<leader>h", group = "harpoon", icon = { icon = "" } },
    }
  },
  keys = {
    {
      "<leader>?",
      function()
        require("which-key").show({ global = false })
      end,
      desc = "Buffer Local Keymaps (which-key)",
    }
  },
}
