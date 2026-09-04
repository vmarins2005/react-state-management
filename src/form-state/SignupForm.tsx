import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

/**
 * ESTADO DE FORMULÁRIO — React Hook Form + Zod.
 *
 * Por que formulário merece categoria própria, e não é "só estado de UI":
 *
 *   - cada tecla digitada é uma mudança de estado. Com `useState` por campo, um
 *     formulário de 15 campos re-renderiza a árvore inteira a cada caractere
 *   - precisa de metadados que `useState` não tem: `touched`, `dirty`,
 *     `isSubmitting`, `isValid`, erro por campo
 *   - a validação tem regras de QUANDO rodar (no blur? no submit? ao digitar,
 *     mas só depois do primeiro erro?)
 *
 * RHF usa componentes **não controlados** por baixo (refs), o que significa que
 * digitar não re-renderiza o formulário. É a diferença entre um form de 30
 * campos fluido e um travado.
 *
 * O ponto mais importante deste arquivo é o SCHEMA:
 *
 *   const schema = z.object({...})
 *   type FormValues = z.infer<typeof schema>
 *
 * Uma fonte de verdade só, que serve simultaneamente para validar em runtime e
 * para tipar em tempo de compilação. Escrever o `type` à mão ao lado do schema
 * é duplicar conhecimento — e os dois divergem na primeira mudança.
 *
 * E a regra que não pode ser esquecida: **esta validação é de conveniência.**
 * Ela melhora a experiência, não protege nada. O servidor precisa validar o
 * mesmo payload com o mesmo schema. Ver o projeto `seguranca-no-next`.
 */

const signupSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[0-9]/, 'Precisa conter ao menos um número'),
    confirmPassword: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar os termos' }) }),
  })
  // Validação que envolve dois campos vive no schema, não no componente.
  // Colocá-la no `onSubmit` é o caminho para ela divergir da versão do servidor.
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type SignupValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    // Valida no blur e revalida ao digitar DEPOIS do primeiro erro. É o modo que
    // menos irrita: não acusa erro enquanto a pessoa ainda está digitando pela
    // primeira vez, mas dá feedback imediato na correção.
    mode: 'onTouched',
  })

  async function onSubmit(values: SignupValues) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    console.info('payload validado:', values)
  }

  if (isSubmitSuccessful) return <p role="status">Conta criada. Confira o console.</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Nome" error={errors.name?.message}>
        <input {...register('name')} aria-invalid={!!errors.name} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" {...register('email')} aria-invalid={!!errors.email} />
      </Field>
      <Field label="Senha" error={errors.password?.message}>
        <input type="password" {...register('password')} aria-invalid={!!errors.password} />
      </Field>
      <Field label="Confirmar senha" error={errors.confirmPassword?.message}>
        <input
          type="password"
          {...register('confirmPassword')}
          aria-invalid={!!errors.confirmPassword}
        />
      </Field>

      <label className="row" style={{ margin: '0.75rem 0' }}>
        <input type="checkbox" {...register('terms')} />
        Aceito os termos
      </label>
      {errors.terms ? (
        <small style={{ color: 'var(--bad)', display: 'block' }}>{errors.terms.message}</small>
      ) : null}

      <button disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Criar conta'}</button>
    </form>
  )
}

function Field(props: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: '0.2rem', marginBottom: '0.6rem' }}>
      <label>{props.label}</label>
      {props.children}
      {props.error ? <small style={{ color: 'var(--bad)' }}>{props.error}</small> : null}
    </div>
  )
}
