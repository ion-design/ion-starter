/**
 * Vite Plugin for Ion Injection
 * Injects the Ion injection script into the HTML during dev server
 * This enables element selection and communication with the parent window
 */

const fs = require('fs');
const path = require('path');

function ionVitePlugin() {
  let injectionScriptContent = null;

  return {
    name: 'vite-plugin-ion',

    configResolved(config) {
      // Load the injection script content
      // The script is located relative to this plugin in .ion/scripts/
      const scriptPath = path.resolve(config.root, '../.ion/scripts/injection-script.js');

      try {
        injectionScriptContent = fs.readFileSync(scriptPath, 'utf-8');
        console.log('[Ion Vite Plugin] Loaded injection script from:', scriptPath);
      } catch (error) {
        console.error('[Ion Vite Plugin] Failed to load injection script:', error.message);
        // Fallback: try alternative path (in case structure differs)
        try {
          const altPath = path.resolve(config.root, '.ion/scripts/injection-script.js');
          injectionScriptContent = fs.readFileSync(altPath, 'utf-8');
          console.log('[Ion Vite Plugin] Loaded injection script from alternate path:', altPath);
        } catch {
          console.error('[Ion Vite Plugin] Could not find injection script at any expected location');
        }
      }
    },

    transformIndexHtml(html) {
      if (!injectionScriptContent) {
        console.warn('[Ion Vite Plugin] No injection script content available, skipping injection');
        return html;
      }

      // Inject the script before the closing </body> tag
      const scriptTag = `
<!-- Ion Injection Script -->
<script>
${injectionScriptContent}
</script>
`;

      // Insert before </body>
      if (html.includes('</body>')) {
        return html.replace('</body>', `${scriptTag}</body>`);
      }

      // Fallback: append to end if no </body> found
      return html + scriptTag;
    },
  };
}

module.exports = ionVitePlugin;
module.exports.default = ionVitePlugin;
