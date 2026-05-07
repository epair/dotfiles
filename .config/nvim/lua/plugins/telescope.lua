local TODO_PATTERNS = { '[#/%-]%s*TODO:', '[#/%-]%s*FIXME:', '[#/%-]%s*XXX:', '[#/%-]%s*HACK:' }

local function is_todo(line)
  for _, pat in ipairs(TODO_PATTERNS) do
    if line:match(pat) then return true end
  end
  return false
end

local function in_git_repo()
  vim.fn.system('git rev-parse --git-dir')
  if vim.v.shell_error ~= 0 then
    vim.notify('Not in a git repository', vim.log.levels.ERROR)
    return false
  end
  return true
end

local function get_todos_from_diff()
  if not in_git_repo() then return nil end

  local results = {}
  local diff_output = vim.fn.systemlist('git diff HEAD --unified=0')
  local current_file = ''
  local current_line = 0

  for _, line in ipairs(diff_output) do
    if line:match('^diff %-%-git') then
      current_file = line:match('b/(.+)$')
    elseif line:match('^@@') then
      current_line = tonumber(line:match('@@ %-%d+,?%d* %+(%d+)')) or 0
    elseif line:match('^%+') and not line:match('^%+%+%+') then
      if is_todo(line) then
        local content = line:gsub('^%+%s*', '')
        table.insert(results, string.format('%s:%d:%s', current_file, current_line, content))
      end
      current_line = current_line + 1
    end
  end

  for _, file in ipairs(vim.fn.systemlist('git ls-files --others --exclude-standard')) do
    local ok, file_lines = pcall(vim.fn.readfile, file)
    if ok then
      for line_num, line_content in ipairs(file_lines) do
        if is_todo(line_content) then
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

local function search_todos_telescope()
  local results = get_todos_from_diff()
  if not results then return end

  local pickers = require('telescope.pickers')
  local finders = require('telescope.finders')
  local conf = require('telescope.config').values

  pickers.new({}, {
    prompt_title = 'TODOs in Git Changes',
    finder = finders.new_table({
      results = results,
      entry_maker = function(entry)
        local filename, lnum, text = entry:match("^([^:]+):(%d+):(.*)$")
        if not filename then return nil end
        return {
          value = entry,
          display = function() return string.format("%s:%s: %s", filename, lnum, vim.trim(text)) end,
          ordinal = entry,
          filename = filename,
          lnum = tonumber(lnum),
          col = 1,
        }
      end,
    }),
    sorter = conf.generic_sorter({}),
    previewer = conf.grep_previewer({}),
  }):find()
end

local function changed_files_telescope()
  if not in_git_repo() then return end

  local files = vim.fn.systemlist('git diff --name-only origin/main...')
  if vim.v.shell_error ~= 0 then
    vim.notify('Failed to diff against main', vim.log.levels.ERROR)
    return
  end

  files = vim.tbl_filter(function(f) return f ~= '' end, files)
  if #files == 0 then
    vim.notify('No changed files relative to main', vim.log.levels.INFO)
    return
  end

  local pickers = require('telescope.pickers')
  local finders = require('telescope.finders')
  local conf = require('telescope.config').values

  pickers.new({}, {
    prompt_title = 'Changed Files (vs main)',
    finder = finders.new_table({
      results = files,
      entry_maker = require('telescope.make_entry').gen_from_file(),
    }),
    sorter = conf.file_sorter({}),
    previewer = require('telescope.previewers').new_termopen_previewer({
      get_command = function(entry)
        return { 'git', 'diff', 'origin/main...', '--', entry.path or entry.value }
      end,
    }),
  }):find()
end

return {
	'nvim-telescope/telescope.nvim',
	tag = '0.1.8',
	dependencies = { 'nvim-lua/plenary.nvim' },
	config = function()
    local actions = require('telescope.actions')
		require('telescope').setup({
      defaults = {
        preview = {
          treesitter = false,
        },
        mappings = {
          i = {
            ["<C-j>"] = actions.move_selection_next,
            ["<C-k>"] = actions.move_selection_previous,
          }
        }
      }
    })
	end,
	keys = {
		{ '<leader><leader>', function()
      local opts = {}
      if os.getenv('DEV_ENV') == vim.fn.getcwd() then
        opts.hidden = true
      end
      require('telescope.builtin').find_files(opts)
    end,
     desc = 'Telescope find files' },
		{ '<leader>sg', function() require('telescope.builtin').grep_string({ search = vim.fn.input("Grep > ") }) end, desc = 'Telescope grep files' },
		{ '<leader>gs', function() require('telescope.builtin').git_status() end, desc = 'Telescope git files' },
    { '<leader>fb', function() require('telescope.builtin').buffers() end, desc = 'Telescope buffers' },
		{ '<leader>gt', search_todos_telescope, desc = 'Search TODOs in git changes' },
		{ '<leader>gf', changed_files_telescope, desc = 'Changed files vs main' },
	}
}
