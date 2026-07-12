"use client";

import { DragEvent, ChangeEvent, useRef, useState } from "react";

type Item = { file: File; id: string; status: "ready" | "working" | "done" | "error"; message?: string; url?: string };
const MAX_FILES = 10;
const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,.pptx,.xlsx,.xls,.html,.htm,.csv,.json,.xml,.epub,.zip,.txt,.md,.jpg,.jpeg,.png,.wav,.mp3";

function prettyBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const room = MAX_FILES - items.length;
    const accepted = incoming.slice(0, Math.max(0, room));
    const total = [...items.map(i => i.file), ...accepted].reduce((sum, f) => sum + f.size, 0);
    if (incoming.length > room) return setNotice(`一次最多处理 ${MAX_FILES} 个文件。`);
    if (total > MAX_BYTES) return setNotice("文件总大小不能超过 100 MB。");
    setNotice("");
    setItems(prev => [...prev, ...accepted.map(file => ({ file, id: crypto.randomUUID(), status: "ready" as const }))]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);
  }

  async function convertAll() {
    const targets = items.filter(i => i.status === "ready" || i.status === "error");
    await Promise.all(targets.map(async item => {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "working", message: undefined } : i));
      const body = new FormData(); body.append("file", item.file);
      try {
        const res = await fetch("/api/convert", { method: "POST", body });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "转换失败，请稍后重试。");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "done", url } : i));
      } catch (e) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "error", message: e instanceof Error ? e.message : "转换失败" } : i));
      }
    }));
  }

  function remove(id: string) {
    setItems(prev => { const found = prev.find(i => i.id === id); if (found?.url) URL.revokeObjectURL(found.url); return prev.filter(i => i.id !== id); });
  }

  const total = items.reduce((s, i) => s + i.file.size, 0);
  return <main>
    <nav><a className="brand" href="#">MARK / DOWN</a><div className="navRight"><span>由 Microsoft MarkItDown 驱动</span><a href="#about">关于</a></div></nav>
    <section className="hero">
      <div className="eyebrow"><span /> DOCUMENT → MARKDOWN</div>
      <h1>让文档，<br/><em>回归纯粹。</em></h1>
      <p className="lead">拖入文件，获得干净、结构化的 Markdown。无需注册，不留记录，即传即用。</p>
    </section>
    <section className="workspace">
      <div className="workspaceHead"><div><b>转换工作区</b><small>01 / UPLOAD</small></div><div className="limits"><span>{items.length} / 10 文件</span><span>{prettyBytes(total)} / 100 MB</span></div></div>
      <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={e => {e.preventDefault(); setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={e => (e.key === "Enter" || e.key === " ") && input.current?.click()}>
        <input ref={input} type="file" multiple accept={ACCEPT} onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && addFiles(e.target.files)} />
        <div className="plus">+</div><h2>将文件拖放到这里</h2><p>或点击浏览本地文件</p><div className="types">PDF · WORD · POWERPOINT · EXCEL · HTML · EPUB · 图片 · 音频</div>
      </div>
      {notice && <div className="notice">{notice}</div>}
      {items.length > 0 && <div className="queue">
        {items.map((item, n) => <div className="fileRow" key={item.id}>
          <span className="index">{String(n + 1).padStart(2,"0")}</span><div className="fileMeta"><b>{item.file.name}</b><small>{prettyBytes(item.file.size)}{item.message ? ` · ${item.message}` : ""}</small></div>
          <span className={`status ${item.status}`}>{item.status === "ready" ? "等待转换" : item.status === "working" ? "转换中…" : item.status === "done" ? "已完成" : "未完成"}</span>
          {item.status === "done" && item.url ? <a className="download" href={item.url} download={`${item.file.name.replace(/\.[^.]+$/, "")}.md`}>下载 .MD</a> : <button className="remove" onClick={() => remove(item.id)} aria-label={`移除 ${item.file.name}`}>×</button>}
        </div>)}
        <button className="convert" onClick={convertAll} disabled={!items.some(i => i.status === "ready" || i.status === "error")}><span>开始转换</span><i>→</i></button>
      </div>}
    </section>
    <section className="facts" id="about">
      <article><small>01</small><h3>只用 MarkItDown</h3><p>转换引擎仅采用微软开源 MarkItDown，不混用其他文档转换工具。</p></article>
      <article><small>02</small><h3>7 天自动失效</h3><p>源文件与结果最多缓存 7 天，随后自动删除。本站不提供任何历史记录。</p></article>
      <article><small>03</small><h3>持续保持新版本</h3><p>每 30 天检查官方版本；发现更新后，经兼容性验证自动升级。</p></article>
    </section>
    <footer><span>MARK / DOWN</span><p>文件仅用于完成转换。请勿上传含敏感信息的文档。</p><a href="https://github.com/microsoft/markitdown" target="_blank" rel="noreferrer">OPEN SOURCE ↗</a></footer>
  </main>;
}
