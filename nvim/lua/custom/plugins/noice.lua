return {
  'folke/noice.nvim',
  dependencies = {
    'MunifTanjim/nui.nvim',
    {
      'rcarriga/nvim-notify',
      opts = {
        background_colour = '#2E3440',
        stages = 'static',
        timeout = 1500,
      },
    },
  },
  event = 'VeryLazy',
  opts = {
    presets = { inc_rename = true },
    views = {
      cmdline_popup = {
        position = {
          row = 7,
          col = '55%',
        },
      },
      cmdline_popupmenu = {
        position = {
          row = 7,
          col = '55%',
        },
      },
    },
    lsp = {
      -- override markdown rendering so that **cmp** and other plugins use **Treesitter**
      override = {
        ['vim.lsp.util.convert_input_to_markdown_lines'] = true,
        ['vim.lsp.util.stylize_markdown'] = true,
        ['cmp.entry.get_documentation'] = true, -- requires hrsh7th/nvim-cmp
      },
    },
  },
}
