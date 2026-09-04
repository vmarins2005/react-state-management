import { useCallback, useEffect, useState } from 'react'

export type Theme = 'claro' | 'escuro' | 'sistema'

const STORAGE_KEY = 'lab:theme'

/**
 * ESTADO PERSISTENTE — sobrevive ao refresh, vive no navegador.
 *
 * Aqui mora a armadilha mais famosa do React moderno, e ela **não** é exclusiva
 * do Next: o **hydration mismatch**.
 *
 * O caminho errado, que parece o mais natural:
 *
 *     const [theme, setTheme] = useState(localStorage.getItem('theme') ?? 'sistema')
 *
 * Três problemas:
 *   1. Em SSR, `localStorage` não existe — quebra no servidor.
 *   2. Mesmo em SPA, o HTML inicial é gerado sem saber o valor, e o primeiro
 *      render do cliente já vem com ele: o React acusa divergência.
 *   3. Em navegação anônima ou com cookies bloqueados, o acesso LANÇA exceção —
 *      não devolve `null`. Toda leitura precisa de try/catch.
 *
 * O padrão correto tem três etapas, e a ordem importa:
 *   1. inicializar com o valor **padrão** (igual ao que o servidor renderizaria)
 *   2. ler o armazenamento dentro de `useEffect`, ou seja, só no cliente e só
 *      depois da hidratação
 *   3. expor `hydrated` para que a UI possa evitar piscar o valor errado
 *
 * Para tema especificamente, a solução de produção é diferente e melhor: um
 * script inline no `<head>`, antes da primeira pintura, que lê o storage e põe
 * um atributo no `<html>`. Assim não há flash nem mismatch, porque o HTML já
 * chega correto. O React só assume depois.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('sistema')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setThemeState(readTheme())
    setHydrated(true)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    writeTheme(next)
  }, [])

  return { theme, setTheme, hydrated }
}

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'claro' || stored === 'escuro' || stored === 'sistema' ? stored : 'sistema'
  } catch {
    // Navegação anônima, cookies bloqueados, iframe restrito: o ACESSO lança.
    // Falhar aqui não pode derrubar a aplicação — o tema é conveniência.
    return 'sistema'
  }
}

function writeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Cota excedida ou storage indisponível. Silenciar é correto neste caso
    // específico: a preferência não persiste, mas nada mais quebra.
  }
}
