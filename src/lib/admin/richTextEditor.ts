import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../../styles/admin-rich-editor.css';

export type RichTextUpload = (file: File) => Promise<string>;

const instances = new Map<string, Quill>();

function mountId(textareaId: string) {
  return `${textareaId}-mount`;
}

function ensureMount(textareaId: string) {
  let mount = document.getElementById(mountId(textareaId));
  const textarea = document.getElementById(textareaId);
  if (!textarea) return null;

  if (!mount) {
    mount = document.createElement('div');
    mount.id = mountId(textareaId);
    mount.className = 'admin-editor-mount';
    textarea.classList.add('admin-editor-sr-only');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.tabIndex = -1;
    textarea.parentNode?.insertBefore(mount, textarea);
  }

  return mount;
}

export async function destroyRichTextEditor(textareaId: string) {
  const mount = document.getElementById(mountId(textareaId));
  if (mount && mount.parentNode) {
    const toolbars = mount.parentNode.querySelectorAll('.ql-toolbar');
    toolbars.forEach((tb) => tb.remove());
    mount.innerHTML = '';
  }
  instances.delete(textareaId);
}

export async function initRichTextEditor(
  textareaId: string,
  html = '',
  options?: { height?: number; uploadImage?: RichTextUpload },
) {
  const mount = ensureMount(textareaId);
  const textarea = document.getElementById(textareaId);
  if (!mount || !(textarea instanceof HTMLTextAreaElement)) return null;

  await destroyRichTextEditor(textareaId);

  const uploadImage = options?.uploadImage;
  const minHeight = options?.height ?? 280;

  const toolbarContainer = [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ...(uploadImage ? [['image']] : []),
    ['clean'],
  ];

  const quill = new Quill(mount, {
    theme: 'snow',
    modules: {
      toolbar: {
        container: toolbarContainer,
        handlers: uploadImage
          ? {
              image: function imageHandler(this: { quill: Quill }) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadImage(file);
                    const range = this.quill.getSelection(true);
                    this.quill.insertEmbed(range.index, 'image', url, 'user');
                    this.quill.setSelection(range.index + 1);
                  } catch (error) {
                    alert(
                      error instanceof Error ? error.message : 'Gorsel yuklenemedi.',
                    );
                  }
                };
                input.click();
              },
            }
          : {},
      },
    },
    placeholder: 'Metninizi buraya yazin…',
  });

  const root = quill.root;
  root.style.minHeight = `${minHeight}px`;

  const body = String(html ?? '').trim();
  if (body) {
    quill.clipboard.dangerouslyPasteHTML(body);
  }

  quill.on('text-change', () => {
    textarea.value = root.innerHTML;
  });
  textarea.value = root.innerHTML;

  instances.set(textareaId, quill);
  return quill;
}

export function getRichTextContent(textareaId: string): string {
  const quill = instances.get(textareaId);
  if (quill) return quill.root.innerHTML;
  const textarea = document.getElementById(textareaId);
  return textarea instanceof HTMLTextAreaElement ? textarea.value : '';
}

export function setRichTextContent(textareaId: string, html: string): void {
  const quill = instances.get(textareaId);
  const textarea = document.getElementById(textareaId);
  if (quill) {
    quill.clipboard.dangerouslyPasteHTML(html ?? '');
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.value = quill.root.innerHTML;
    }
  } else if (textarea instanceof HTMLTextAreaElement) {
    textarea.value = html ?? '';
  }
}

