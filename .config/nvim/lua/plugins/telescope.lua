return {
	'nvim-telescope/telescope.nvim',
	tag = '0.1.8',
	dependencies = { 'nvim-lua/plenary.nvim' },
	config = function()
		require('telescope').setup({
      defaults = {
        mappings = {
          i = {
            ["<C-j>"] = require('telescope.actions').move_selection_next,
            ["<C-k>"] = require('telescope.actions').move_selection_previous,
          }
        }
      }
    })
	end,
	keys = {
		{ '<leader><leader>', function()
      local opts = {}
      local builtin = require('telescope.builtin')
      if os.getenv('DEV_ENV') ~= nil and os.getenv("DEV_ENV") == vim.fn.getcwd() then
        opts.hidden = true
      end
      builtin.find_files(opts)
    end,
     desc = 'Telescope find files' },
		{ '<leader>sg', function() require('telescope.builtin').grep_string({ search = vim.fn.input("Grep > ") }); end, desc = 'Telescope grep files' },
		{ '<leader>gs', require('telescope.builtin').git_status, desc = 'Telescope git files' },
    { '<leader>fb', require('telescope.builtin').buffers, desc = 'Telescope buffers' }
	},
}
