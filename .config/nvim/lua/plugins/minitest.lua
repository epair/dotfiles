return {
  { "epair/neotest-minitest" },
  {
    "nvim-neotest/neotest",
    opts = {
      adapters = {
        ["neotest-minitest"] = {
          test_cmd = function()
            return "bin/docker/test-single"
          end,
          transform_spec_path = function(path)
            local prefix = require("neotest-minitest").root(path)
            return string.sub(path, string.len(prefix) + 2, -1)
          end,

          results_path = "tmp/minitest.output",
        },
      },
    },
  },
}
