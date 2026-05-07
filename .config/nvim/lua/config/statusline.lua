local mode_labels = {
  n = 'NORMAL', i = 'INSERT',
  v = 'VISUAL', V = 'V-LINE', ['\22'] = 'V-BLOCK',
  s = 'SELECT', S = 'S-LINE', ['\19'] = 'S-BLOCK',
  c = 'COMMAND', R = 'REPLACE', t = 'TERMINAL',
}

local mode_hl = {
  NORMAL = 'StatusLineModeNormal',
  INSERT = 'StatusLineModeInsert',
  VISUAL = 'StatusLineModeVisual',
  ['V-LINE'] = 'StatusLineModeVisual',
  ['V-BLOCK'] = 'StatusLineModeVisual',
  SELECT = 'StatusLineModeVisual',
  ['S-LINE'] = 'StatusLineModeVisual',
  ['S-BLOCK'] = 'StatusLineModeVisual',
  COMMAND = 'StatusLineModeCommand',
  REPLACE = 'StatusLineModeReplace',
  TERMINAL = 'StatusLineModeTerminal',
}

local function set_highlights()
  vim.api.nvim_set_hl(0, 'StatusLineModeNormal',   { fg = '#1a1b26', bg = '#7aa2f7', bold = true })
  vim.api.nvim_set_hl(0, 'StatusLineModeInsert',   { fg = '#1a1b26', bg = '#9ece6a', bold = true })
  vim.api.nvim_set_hl(0, 'StatusLineModeVisual',   { fg = '#1a1b26', bg = '#bb9af7', bold = true })
  vim.api.nvim_set_hl(0, 'StatusLineModeCommand',  { fg = '#1a1b26', bg = '#e0af68', bold = true })
  vim.api.nvim_set_hl(0, 'StatusLineModeReplace',  { fg = '#1a1b26', bg = '#f7768e', bold = true })
  vim.api.nvim_set_hl(0, 'StatusLineModeTerminal', { fg = '#1a1b26', bg = '#73daca', bold = true })
  vim.api.nvim_set_hl(0, 'StatusLineBranch',       { fg = '#c0caf5', bg = '#3b4261' })
end

set_highlights()
vim.api.nvim_create_autocmd('ColorScheme', { callback = set_highlights })

local function mode()
  local raw = vim.fn.mode()
  local label = mode_labels[raw] or raw:upper()
  local hl = mode_hl[label] or 'StatusLineModeNormal'
  return '%#' .. hl .. '# ' .. label .. ' %#StatusLine#'
end

local function branch()
  local head = vim.b.gitsigns_head
  if not head or head == '' then return '' end
  return '%#StatusLineBranch#  ' .. head .. ' %#StatusLine#'
end

local SEV_LABELS = {
  { vim.diagnostic.severity.ERROR, 'E' },
  { vim.diagnostic.severity.WARN, 'W' },
  { vim.diagnostic.severity.INFO, 'I' },
  { vim.diagnostic.severity.HINT, 'H' },
}

local function compute_diagnostics(buf)
  local counts = vim.diagnostic.count(buf)
  local parts = {}
  for _, pair in ipairs(SEV_LABELS) do
    local n = counts[pair[1]]
    if n and n > 0 then parts[#parts + 1] = pair[2] .. n end
  end
  return #parts > 0 and (' ' .. table.concat(parts, ' ') .. ' ') or ''
end

vim.api.nvim_create_autocmd('DiagnosticChanged', {
  group = vim.api.nvim_create_augroup('custom_statusline_diag', { clear = true }),
  callback = function(args)
    vim.b[args.buf].statusline_diag = compute_diagnostics(args.buf)
  end,
})

_G.statusline = function()
  return table.concat({
    mode(),
    branch(),
    ' %f %m%r',
    '%=',
    vim.b.statusline_diag or '',
    ' %y ',
    ' %l:%c %P ',
  })
end

vim.o.statusline = '%!v:lua.statusline()'
vim.o.laststatus = 2
