-- extend nvim with specialized textobjs (examples):
-- ii / ai: Indentation-based blocks.
-- iS / aS: Subwords (parts of camelCase or snake_case).
-- iv / av: Values in key-value pairs or assignments.
-- L: URLs (entire links).
-- in / an: Numbers (digits including signs and decimals).
-- gG: The entire buffer.
return {
	"chrisgrieser/nvim-various-textobjs",
	event = "VeryLazy",
	opts = {
		keymaps = {
			useDefaults = true
		}
	},
}
