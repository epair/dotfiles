-- Helper function to extract TODOs from git diff and untracked files
local function get_todos_from_diff()
  -- Check if in a git repo
  vim.fn.system('git rev-parse --git-dir')
  if vim.v.shell_error ~= 0 then
    vim.notify('Not in a git repository', vim.log.levels.ERROR)
    return nil
  end

  local results = {}

  -- 1. Get TODOs from tracked file changes (git diff HEAD)
  local diff_output = vim.fn.systemlist('git diff HEAD --unified=0')
  local current_file = ''
  local current_line = 0

  for _, line in ipairs(diff_output) do
    if line:match('^diff %-%-git') then
      current_file = line:match('b/(.+)$')
    elseif line:match('^@@') then
      local line_num = line:match('@@ %-%d+,?%d* %+(%d+)')
      current_line = tonumber(line_num) or 0
    elseif line:match('^%+') and not line:match('^%+%+%+') then
      if line:match('[#/%-]%s*TODO:') or line:match('[#/%-]%s*FIXME:') or
         line:match('[#/%-]%s*XXX:') or line:match('[#/%-]%s*HACK:') then
        local content = line:gsub('^%+%s*', '')
        table.insert(results, string.format('%s:%d:%s', current_file, current_line, content))
      end
      current_line = current_line + 1
    end
  end

  -- 2. Get TODOs from untracked files
  local untracked_files = vim.fn.systemlist('git ls-files --others --exclude-standard')

  for _, file in ipairs(untracked_files) do
    -- Read the file and search for TODOs
    local ok, file_lines = pcall(vim.fn.readfile, file)
    if ok then
      for line_num, line_content in ipairs(file_lines) do
        if line_content:match('[#/%-]%s*TODO:') or line_content:match('[#/%-]%s*FIXME:') or
           line_content:match('[#/%-]%s*XXX:') or line_content:match('[#/%-]%s*HACK:') then
          table.insert(results, string.format('%s:%d:%s', file, line_num, line_content))
        end
      end
    end
  end

  if #results == 0 then
    vim.notify('No TODOs found in git changes', vim.log.levels.INFO)
    return nil
  end

  return results
end

-- Create Telescope picker for TODOs
local function search_todos_telescope()
  local results = get_todos_from_diff()
  if not results then
    return
  end

  local pickers = require('telescope.pickers')
  local finders = require('telescope.finders')
  local conf = require('telescope.config').values

  local make_entry = function(entry)
    local filename, lnum, text = entry:match("^([^:]+):(%d+):(.*)$")
    if not filename then
      return nil
    end

    return {
      value = entry,
      display = function(tbl)
        return string.format("%s:%s: %s", filename, lnum, vim.trim(text))
      end,
      ordinal = entry,
      filename = filename,
      lnum = tonumber(lnum),
      col = 1,
    }
  end

  pickers.new({}, {
    prompt_title = 'TODOs in Git Changes',
    finder = finders.new_table({
      results = results,
      entry_maker = make_entry,
    }),
    sorter = conf.generic_sorter({}),
    previewer = conf.grep_previewer({}),
  }):find()
end

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
		{ '<leader>gs', function() require('telescope.builtin').git_status(); end, desc = 'Telescope git files' },
    { '<leader>fb', function() require('telescope.builtin').buffers(); end, desc = 'Telescope buffers' },
		{ '<leader>gt', search_todos_telescope, desc = 'Search TODOs in git changes' },
	}
}
