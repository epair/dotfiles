return {
  'joshuavial/aider.nvim',
  config = function()
    require('aider').setup {
      auto_manage_context = true,
      default_bindings = true,
    }
  end,
  keys = {
    {
      '<leader>oa',
      function()
        require('aider').AiderOpen()
      end,
      desc = 'Aider Open',
    },
    {
      '<leader>ob',
      function()
        require('aider').AiderBackground()
      end,
      desc = 'Aider Background',
    },
  },
}
