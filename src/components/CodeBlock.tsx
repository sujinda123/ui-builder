// "use client";

// import { useEffect, useRef, useState } from "react";
// import { EditorView, basicSetup } from "codemirror";
// import { javascript } from "@codemirror/lang-javascript";
// import { oneDark } from "@codemirror/theme-one-dark";
// import { EditorState } from "@codemirror/state";

// import prettier from "prettier/standalone";
// import parserBabel from "prettier/plugins/babel";
// import parserEstree from "prettier/plugins/estree";

// import { IsolatedPreview } from "./components/IsolatedPreview";

// export function Home() {
//   const editorRef = useRef<HTMLDivElement>(null);
//   const [formattedCode, setFormattedCode] = useState<string>("");

//   const rawCode = `
// function   hello( ){
// console.log("Hello Next.js")
// }
// hello()
// `;

//   // 1) format ก่อน แล้วเก็บไว้ใช้ทั้ง 2 ที่
//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       const formatted = await prettier.format(rawCode, {
//         parser: "babel",
//         plugins: [parserBabel, parserEstree],
//       });

//       if (cancelled) return;
//       setFormattedCode(formatted);
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [rawCode]);

//   // 2) สร้าง CodeMirror ด้วย formattedCode (read-only)
//   useEffect(() => {
//     if (!editorRef.current) return;
//     if (!formattedCode) return;

//     const state = EditorState.create({
//       doc: formattedCode,
//       extensions: [
//         basicSetup,
//         javascript(),
//         oneDark,
//         EditorState.readOnly.of(true),
//         EditorView.editable.of(false),
//         EditorView.theme({
//           "&": { height: "300px" }, // ปรับเองได้
//           ".cm-scroller": { overflow: "auto" },
//         }),
//       ],
//     });

//     const view = new EditorView({
//       state,
//       parent: editorRef.current,
//     });

//     return () => view.destroy();
//   }, [formattedCode]);

//   return (
//     <div className="grid gap-4 p-4">
//       {/* ✅ โชว์โค้ด */}
//       <div ref={editorRef} className="rounded-xl border overflow-hidden" />

//       {/* ✅ preview รันใน iframe แบบแยกโลก */}
//       <div className="h-[300px] rounded-xl overflow-hidden">
//         <IsolatedPreview
//           // ❗ส่งแค่ body html (ไม่ต้องมี <!doctype><html>...)
//           html={`
//             <div class="p-6">
//               <div id="app" class="text-lg font-semibold"></div>
//               <div class="mt-2 text-sm opacity-70">Tailwind works in iframe only</div>
//             </div>
//           `}
//           // ✅ ใช้ตัวที่ format แล้ว จะตรงกับ editor
//           js={formattedCode}
//           tailwind
//         />
//       </div>
//     </div>
//   );
// }
