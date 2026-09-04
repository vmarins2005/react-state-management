import { useEffect, useMemo, useState } from 'react'

/**
 * O SEXTO TIPO DE ESTADO: o que NÃO deveria existir.
 *
 * Estado derivado é qualquer valor calculável a partir de outro estado. Ele não
 * é uma categoria a ser gerenciada — é um erro a ser eliminado.
 */

const NOMES = ['Ana Ribeiro', 'Bruno Costa', 'Carla Dias', 'Diego Alves', 'Elisa Prado']

/**
 * ANTI-EXEMPLO. Dois bugs, ambos reais e ambos difíceis de diagnosticar:
 *
 * 1. **Render duplo.** Digita -> render 1 (com a lista velha) -> efeito ->
 *    setState -> render 2. Existe uma janela em que a tela mostra o termo novo
 *    com a lista antiga. Em lista grande, isso é um flash visível.
 *
 * 2. **Divergência.** Se `NOMES` mudar sem que `term` mude, o efeito não roda e
 *    `filtered` fica desatualizado. A correção habitual é adicionar mais uma
 *    dependência ao array — e a cada dependência esquecida nasce um bug novo.
 *
 * A regra: **`useEffect` serve para sincronizar com sistemas EXTERNOS**
 * (rede, DOM, timer, assinatura). Não serve para sincronizar estado interno com
 * estado interno. Se as duas pontas são React, é cálculo, não efeito.
 */
export function BuscaRuim() {
  const [term, setTerm] = useState('')
  const [filtered, setFiltered] = useState<string[]>(NOMES)

  useEffect(() => {
    setFiltered(NOMES.filter((nome) => nome.toLowerCase().includes(term.toLowerCase())))
  }, [term])

  return (
    <div>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Filtrar"
        aria-label="Filtrar (versão ruim)"
      />
      <ul>
        {filtered.map((nome) => (
          <li key={nome}>{nome}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * VERSÃO BOA — o valor derivado é calculado no render. Um estado a menos, um
 * efeito a menos, um render a menos, e a divergência deixa de ser possível.
 *
 * Sobre o `useMemo`: ele é opcional aqui. Numa lista de 5 nomes é ruído. Ele se
 * justifica quando o cálculo é caro (milhares de itens, agregação) ou quando o
 * resultado é passado como prop para um componente memoizado.
 *
 * Com o React Compiler ligado, a memoização passa a ser automática e escrever
 * `useMemo` à mão vira exceção, não regra.
 */
export function BuscaBoa() {
  const [term, setTerm] = useState('')

  const filtered = useMemo(
    () => NOMES.filter((nome) => nome.toLowerCase().includes(term.toLowerCase())),
    [term],
  )

  return (
    <div>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Filtrar"
        aria-label="Filtrar (versão boa)"
      />
      <ul>
        {filtered.map((nome) => (
          <li key={nome}>{nome}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * O checklist de "isto deveria ser estado?", para usar em code review:
 *
 *   [ ] dá para calcular a partir de outro estado ou prop?      -> calcule
 *   [ ] só é usado num handler, nunca no render?                -> use ref
 *   [ ] vem do servidor?                                        -> é cache
 *   [ ] o usuário deveria poder compartilhar por link?          -> é URL
 *   [ ] precisa sobreviver ao refresh?                          -> é storage
 *   [ ] é um campo de formulário?                               -> é RHF
 *   [ ] sobrou?                                                 -> aí sim, useState
 *
 * A maior parte do `useState` que você encontra numa base madura cai numa das
 * seis primeiras linhas.
 */
