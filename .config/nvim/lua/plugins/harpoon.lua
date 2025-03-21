return {
  "theprimeagen/harpoon",
  branch = "harpoon2",
  dependencies = { "nvim-lua/plenary.nvim" },
  config = function()
    require("harpoon"):setup()
  end,
  keys = {
    { "<leader>hp", function() require("harpoon"):list():prepend() end, desc = 'Harpoon Prepend buffer' },
    { "<leader>ha", function() require("harpoon"):list():add() end, desc = 'Harpoon Add buffer' },
    { "<leader>hm", function() local harpoon = require("harpoon") harpoon.ui:toggle_quick_menu(harpoon:list()) end, desc = 'Harpoon menu' },
    { "<leader>hh", function() require('harpoon'):list():select(1) end, desc = 'Harpoon 1' },
    { "<leader>hj", function() require('harpoon'):list():select(2) end, desc = 'Harpoon 2' },
    { "<leader>hk", function() require('harpoon'):list():select(3) end, desc = 'Harpoon 3'  },
    { "<leader>hl", function() require('harpoon'):list():select(4) end, desc = 'Harpoon 4'  },
    { "<leader>hH", function() require('harpoon'):list():replace_at(1) end, desc = 'Harpoon Replace 1' },
    { "<leader>hJ", function() require('harpoon'):list():replace_at(2) end, desc = 'Harpoon Replace 2' },
    { "<leader>hK", function() require('harpoon'):list():replace_at(3) end, desc = 'Harpoon Replace 3' },
    { "<leader>hL", function() require('harpoon'):list():replace_at(4) end, desc = 'Harpoon Replace 4' },
  }
}
