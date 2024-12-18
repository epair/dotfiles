return {
  {
    "nvim-lualine/lualine.nvim",
    opts = {
      sections = {
        lualine_y = {
          { "filetype", separator = "" },
        },
        lualine_z = {
          { "progress", separator = "", padding = { left = 1, right = 0 } },
          { "location", separator = "", padding = { left = 1, right = 1 } },
        },
      },
    },
  },
}
