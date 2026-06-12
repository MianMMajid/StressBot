/**
 * Server-side proxy for www.saucedemo.com.
 *
 * We proxy the page through our own origin so iframe auth is first-party
 * (avoids third-party cookie restrictions in embedded contexts). The injected
 * boot script normalizes the iframe URL path to "/" before the React bundle
 * initializes, preventing Router mismatches from "/api/sauce".
 */
export const dynamic = "force-dynamic";

const SAUCE_ORIGIN = "https://www.saucedemo.com";

// Runs before Saucedemo's bundle so React Router starts at "/",
// then auto-submits valid credentials on the login screen.
const BOOT_PATH_SCRIPT = `
<script>
(function(){
  try{
    if(window.history && window.history.replaceState && window.location.pathname !== '/'){
      window.history.replaceState({}, '', '/');
    }

    function setInputValue(el, value){
      var proto = window.HTMLInputElement && window.HTMLInputElement.prototype;
      var desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
      if(desc && typeof desc.set === 'function'){
        desc.set.call(el, value);
      }else{
        el.value = value;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function autoLogin(){
      try{
        var user = document.querySelector('[data-test="username"]');
        var pass = document.querySelector('[data-test="password"]');
        var btn = document.querySelector('[data-test="login-button"]');
        if(!user || !pass || !btn) return;
        setInputValue(user, 'standard_user');
        setInputValue(pass, 'secret_sauce');
        btn.click();
      }catch(e){}
    }

    // Wait until the React login form is mounted.
    window.addEventListener('load', function(){
      setTimeout(autoLogin, 120);
      setTimeout(autoLogin, 350);
    }, { once: true });
  }catch(e){}
})();
</script>`;

export async function GET() {
  let upstream: Response;
  try {
    upstream = await fetch(`${SAUCE_ORIGIN}/`, {
      headers: {
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/124.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });
  } catch {
    return new Response(
      `<html><body style="font-family:monospace;padding:2rem">
        <b>Proxy error:</b> unable to reach ${SAUCE_ORIGIN}.
        Check your internet connection and try again.
      </body></html>`,
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  }

  let html = await upstream.text();

  // Inject immediately after <head> so the script runs before bundle scripts.
  html = html.replace(
    /(<head(?:\s[^>]*)?>)/i,
    `$1<base href="${SAUCE_ORIGIN}/">${BOOT_PATH_SCRIPT}`
  );

  return new Response(html, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // No caching — every load should re-run the pre-auth injection.
      "Cache-Control": "no-store",
      // Allow framing from our own Next.js origin.
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
