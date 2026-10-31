// A local, dependency-free A4 report: Korean text is rendered with the bundled
// font into 2× page images. Nothing is sent to a server or third-party API.
const encode = text => new TextEncoder().encode(text);
export function packPdf(images, width, height) {
  const parts = [encode('%PDF-1.4\n% local assessment report\n')], offsets = [0];
  let length = parts[0].length;
  const add = bytes => { parts.push(bytes); length += bytes.length; };
  const object = (id, head, stream) => {
    offsets[id] = length;
    add(encode(`${id} 0 obj\n${head}`));
    if (stream) { add(encode('\nstream\n')); add(stream); add(encode('\nendstream')); }
    add(encode('\nendobj\n'));
  };
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, `<< /Type /Pages /Count ${images.length} /Kids [${images.map((_,i) => `${3+i*3} 0 R`).join(' ')}] >>`);
  images.forEach((bytes,i) => {
    const id = 3+i*3;
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
    object(id+1, `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`, bytes);
    const commands = encode('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q');
    object(id+2, `<< /Length ${commands.length} >>`, commands);
  });
  const xref = length, size = 3+images.length*3;
  add(encode(`xref\n0 ${size}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return new Blob(parts, { type: 'application/pdf' });
}
export async function createReportPdf(report) {
  const allText = JSON.stringify(report);
  await document.fonts.load('14px "Noto Sans KR Variable"', allText);
  await document.fonts.ready;
  const W=794, H=1123, margin=48, images=[];
  let canvas, ctx, y, page=0;
  const font = (size=14, bold=false) => { ctx.font=`${bold?700:400} ${size}px "Noto Sans KR Variable", sans-serif`; };
  const wrap = (text, maxWidth, size=14, bold=false) => {
    font(size,bold); const lines=[];
    for(const paragraph of String(text).split('\n')) {
      let line='';
      for(const char of paragraph) { if(line && ctx.measureText(line+char).width>maxWidth){lines.push(line);line='';}line+=char; }
      lines.push(line);
    }
    return lines;
  };
  const text = (value,x,top,size=14,color='#374538',bold=false) => {font(size,bold);ctx.fillStyle=color;ctx.fillText(value,x,top);};
  const flush = () => {
    text('한입의 여행 · 소화 평가 답안 보고서',margin,H-28,10,'#89917f');
    text(`${page}`,W-margin-20,H-28,10,'#89917f');
    const binary=atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]);
    images.push(Uint8Array.from(binary,c=>c.charCodeAt(0)));
  };
  const newPage = () => {
    if(canvas)flush(); page++;
    if(!canvas){
      canvas=document.createElement('canvas');canvas.width=W*2;canvas.height=H*2;
      ctx=canvas.getContext('2d');ctx.scale(2,2);
    }
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    text('한입의 여행 | 소화 과정 평가',margin,48,22,'#455c3e',true);
    let headerY=79;
    for(const line of wrap(`${report.student.school}  ${report.student.classroom}  ${report.student.number}번  ${report.student.name}`,W-margin*2,13)){text(line,margin,headerY,13);headerY+=21;}
    ctx.strokeStyle='#dce3d4';ctx.beginPath();ctx.moveTo(margin,headerY);ctx.lineTo(W-margin,headerY);ctx.stroke();y=headerY+27;
  };
  newPage();
  text(`채점 결과: ${report.correct} / 28문항 정답`,margin,y,19,'#cf7848',true);y+=31;
  text(`PDF 생성 시각: ${new Date(report.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})} (한국 시간)`,margin,y,12);y+=23;
  text('아래는 제출 시점의 답안입니다. 문항당 1점이며 주관식은 허용된 핵심 용어로 자동 채점합니다.',margin,y,12);y+=22;
  text('주관식의 동의어나 표현 차이는 담당 교사가 최종 확인할 수 있습니다.',margin,y,12);y+=30;
  for(const row of report.rows){
    const lines=[
      ...wrap(row.question,W-margin*2,14,true).map(t=>[t,14,'#374538',true]),
      ...wrap(`학생 답: ${row.answer}`,W-margin*2).map(t=>[t,14,'#4f5d49',false]),
      ...wrap(`정답: ${row.expected}`,W-margin*2).map(t=>[t,14,'#798566',false]),
    ];
    const block=49+lines.length*22;
    if(y+block>H-62)newPage();
    text(`${String(row.number).padStart(2,'0')}  ${row.food} · ${row.stage}`,margin,y,13,'#9b774f',true);
    text(row.correct?'정답 (O)':'오답 (X)',W-margin-78,y,13,row.correct?'#60824e':'#c27251',true);y+=27;
    for(const [t,size,color,bold] of lines){text(t,margin,y,size,color,bold);y+=22;}
    ctx.strokeStyle='#e6e9df';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(W-margin,y);ctx.stroke();y+=22;
  }
  flush();
  return packPdf(images,W*2,H*2);
}
export function downloadReport(blob, report) {
  const safe = value => value.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_');
  const url=URL.createObjectURL(blob), link=document.createElement('a');
  link.href=url;link.download=`소화평가_${safe(report.student.classroom)}_${safe(report.student.number)}_${safe(report.student.name)}.pdf`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
