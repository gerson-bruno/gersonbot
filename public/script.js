
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function renderMarkdown(text) {
  if(!text) text = "Ops! Sem resposta do GersonBot 😅";
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');

  const lines = html.split('\n');
  let inUL = false, inOL = false;
  html = '';
  lines.forEach(line => {
    if (/^\* /.test(line)) {
      if (!inUL) { html += '<ul>'; inUL = true; }
      html += '<li>' + line.replace(/^\* /, '') + '</li>';
    } else if (/^\d+\. /.test(line)) {
      if (!inOL) { html += '<ol>'; inOL = true; }
      html += '<li>' + line.replace(/^\d+\. /, '') + '</li>';
    } else {
      if (inUL) { html += '</ul>'; inUL = false; }
      if (inOL) { html += '</ol>'; inOL = false; }
      html += line + '<br>';
    }
  });
  if (inUL) html += '</ul>';
  if (inOL) html += '</ol>';
  return html;
}

async function typeTextHTML(element, html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  element.innerHTML = "<b>GersonBot:</b><br>";
  for (const node of Array.from(tempDiv.childNodes)) {
    if (node.nodeType === 3) {
      for (let i = 0; i < node.textContent.length; i++) {
        element.innerHTML += node.textContent[i];
        document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
        await sleep(10);
      }
    } else {
      element.appendChild(node.cloneNode(true));
      document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
      await sleep(50);
    }
  }
}

async function enviar() {
  const input = document.getElementById("pergunta");
  const chat = document.getElementById("chat");
  const plane = document.querySelector(".plane");
  const pergunta = input.value.trim();
  if (!pergunta) return;

  plane.classList.add("fly");
  setTimeout(() => plane.classList.remove("fly"), 600);

  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerHTML = `<b>Você:</b> ${pergunta}`;
  chat.appendChild(userMsg);
  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  const botMsg = document.createElement("div");
  botMsg.className = "msg bot";
  botMsg.innerHTML = "<b>GersonBot:</b> <br>Carregando...";
  chat.appendChild(botMsg);
  chat.scrollTop = chat.scrollHeight;

  try {
    // chamada ajustada para produção
    const resposta = await fetch("/perguntar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta })
    });

    const data = await resposta.json();
    const formatted = renderMarkdown(data.resposta);
    await typeTextHTML(botMsg, formatted);
    chat.scrollTop = chat.scrollHeight;

  } catch (err) {
    botMsg.innerHTML = "<b>GersonBot:</b> Ops! Não consegui responder 😅";
    console.error(err);
  }
}

document.getElementById("pergunta").addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    enviar();
  }
});
document.getElementById("sendBtn").addEventListener("click", enviar);