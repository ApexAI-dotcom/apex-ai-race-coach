import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { Layout } from '@/components/layout/Layout'
import { PageMeta } from '@/components/seo/PageMeta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

type View = 'sign_in' | 'forgot_password'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, signInEmail, signUpEmail, signInGoogle, resetPasswordForEmail } = useAuth()
  const [view, setView] = useState<View>('sign_in')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register' || params.get('mode') === 'signup') {
      setIsSignUp(true);
    }
    
    if (!authLoading && user) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, location])

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (user) {
    return null
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitLoading(true)
    const { error } = isSignUp
      ? await signUpEmail(email, password)
      : await signInEmail(email, password)
    setSubmitLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    
    if (isSignUp) {
      setSuccess("Un email de confirmation t'a été envoyé ! Vérifie ta boîte mail (et tes spams) pour activer ton compte. Tu pourras ensuite te connecter.")
      setSubmitLoading(false)
      // On ne redirige pas, on laisse l'utilisateur lire le message
      return
    }

    const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'
    navigate(from, { replace: true })
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!email.trim()) {
      setError('Indique ton adresse email.')
      return
    }
    setSubmitLoading(true)
    const { error } = await resetPasswordForEmail(email.trim())
    setSubmitLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess('Un lien de réinitialisation a été envoyé à ton adresse email.')
  }

  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageMeta
        title="Connexion | ApexAI"
        description="Connectez-vous pour accéder à votre tableau de bord et vos analyses."
        path="/login"
      />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl font-bold text-foreground">
                {view === 'forgot_password' 
                  ? 'Mot de passe oublié' 
                  : isSignUp 
                    ? "Créer un compte" 
                    : 'Connexion'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {view === 'forgot_password'
                  ? 'Indique ton email pour recevoir un lien de réinitialisation.'
                  : isSignUp
                    ? 'Inscrivez-vous pour commencer vos analyses'
                    : 'Connectez-vous à votre compte APEX AI'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(error || success) && (
                <Alert
                  variant={error ? 'destructive' : 'default'}
                  className={`mb-4 ${success ? 'bg-green-500/10 border-green-500/50' : ''}`}
                >
                  {error ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <AlertDescription className={success ? 'text-green-200' : ''}>
                    {error || success}
                  </AlertDescription>
                </Alert>
              )}

              {view === 'sign_in' && (
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/10 bg-secondary/50 hover:bg-secondary/80 text-foreground"
                    onClick={async () => {
                      setGoogleLoading(true)
                      const { error } = await signInGoogle()
                      if (error) { setError(error.message); setGoogleLoading(false) }
                    }}
                    disabled={googleLoading || submitLoading}
                  >
                    {googleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GoogleIcon />}
                    Continuer avec Google
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2 px-4">
                    En continuant, vous acceptez nos <a href="/legal" className="underline hover:text-primary">CGU</a> et notre <a href="/legal" className="underline hover:text-primary">politique de confidentialité</a>.
                  </p>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </div>
              )}

              {view === 'sign_in' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground text-sm font-medium">
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="bg-secondary/50 border-white/10 text-foreground placeholder:text-muted-foreground"
                      required
                      disabled={submitLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground text-sm font-medium">
                      Mot de passe
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      className="bg-secondary/50 border-white/10 text-foreground placeholder:text-muted-foreground"
                      required={!isSignUp}
                      disabled={submitLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {isSignUp ? 'Inscription…' : 'Connexion…'}
                      </>
                    ) : isSignUp ? (
                      "S'inscrire"
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                  <div className="flex flex-col gap-2 pt-2 text-center text-sm">
                    <button
                      type="button"
                      onClick={() => { setView('forgot_password'); setError(null); setSuccess(null); }}
                      className="text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-foreground text-sm font-medium">
                      Adresse email
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="bg-secondary/50 border-white/10 text-foreground placeholder:text-muted-foreground"
                      required
                      disabled={submitLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Envoi…
                      </>
                    ) : (
                      'Envoyer le lien de réinitialisation'
                    )}
                  </Button>
                  <div className="pt-2 text-center text-sm">
                    <button
                      type="button"
                      onClick={() => { setView('sign_in'); setError(null); setSuccess(null); }}
                      className="text-primary hover:underline"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}
