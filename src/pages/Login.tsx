import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { Layout } from '@/components/layout/Layout'
import { PageMeta } from '@/components/seo/PageMeta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, location])

  // Écouter les erreurs d'authentification
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      }
      if (event === 'SIGNED_OUT') {
        setError(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, location])

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
    return null // Redirection en cours
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
                Connexion
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Connectez-vous à votre compte APEX AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="[&_.supabase-auth-ui_ui-message]:text-sm [&_.supabase-auth-ui_ui-message]:text-muted-foreground [&_.supabase-auth-ui_ui-message]:mb-4 [&_.supabase-auth-ui_ui-label]:text-sm [&_.supabase-auth-ui_ui-label]:font-medium [&_.supabase-auth-ui_ui-label]:text-foreground [&_.supabase-auth-ui_ui-label]:mb-2 [&_.supabase-auth-ui_ui-input]:w-full [&_.supabase-auth-ui_ui-input]:px-3 [&_.supabase-auth-ui_ui-input]:py-2 [&_.supabase-auth-ui_ui-input]:rounded-lg [&_.supabase-auth-ui_ui-input]:bg-secondary/50 [&_.supabase-auth-ui_ui-input]:border [&_.supabase-auth-ui_ui-input]:border-white/10 [&_.supabase-auth-ui_ui-input]:text-foreground [&_.supabase-auth-ui_ui-input]:placeholder:text-muted-foreground [&_.supabase-auth-ui_ui-input]:focus:outline-none [&_.supabase-auth-ui_ui-input]:focus:ring-2 [&_.supabase-auth-ui_ui-input]:focus:ring-primary [&_.supabase-auth-ui_ui-input]:focus:border-transparent [&_.supabase-auth-ui_ui-button]:w-full [&_.supabase-auth-ui_ui-button]:mt-4 [&_.supabase-auth-ui_ui-button]:px-4 [&_.supabase-auth-ui_ui-button]:py-2 [&_.supabase-auth-ui_ui-button]:rounded-lg [&_.supabase-auth-ui_ui-button]:bg-primary [&_.supabase-auth-ui_ui-button]:text-primary-foreground [&_.supabase-auth-ui_ui-button]:font-medium [&_.supabase-auth-ui_ui-button]:hover:bg-primary/90 [&_.supabase-auth-ui_ui-button]:transition-colors [&_.supabase-auth-ui_ui-divider]:my-4 [&_.supabase-auth-ui_ui-divider]:border-t [&_.supabase-auth-ui_ui-divider]:border-white/10 [&_.supabase-auth-ui_ui-link]:text-primary [&_.supabase-auth-ui_ui-link]:hover:underline">
                <Auth
                  supabaseClient={supabase}
                  localization={{
                    variables: {
                      sign_in: {
                        email_label: 'Adresse email',
                        password_label: 'Mot de passe',
                        email_input_placeholder: 'Votre adresse email',
                        password_input_placeholder: 'Votre mot de passe',
                        button_label: 'Se connecter',
                        loading_button_label: 'Connexion…',
                        link_text: 'Déjà un compte ? Se connecter',
                      },
                      sign_up: {
                        email_label: 'Adresse email',
                        password_label: 'Créer un mot de passe',
                        email_input_placeholder: 'Votre adresse email',
                        password_input_placeholder: 'Votre mot de passe',
                        button_label: "S'inscrire",
                        loading_button_label: "Inscription…",
                        link_text: "Pas encore de compte ? S'inscrire",
                      },
                      magic_link: {
                        email_input_label: 'Adresse email',
                        email_input_placeholder: 'Votre adresse email',
                        button_label: 'Recevoir un lien de connexion',
                        loading_button_label: 'Envoi du lien…',
                        link_text: 'Recevoir un lien de connexion',
                      },
                      forgotten_password: {
                        email_label: 'Adresse email',
                        email_input_placeholder: 'Votre adresse email',
                        button_label: 'Envoyer les instructions',
                        loading_button_label: 'Envoi…',
                        link_text: 'Mot de passe oublié ?',
                      },
                    },
                  }}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: 'hsl(var(--primary))',
                          brandAccent: 'hsl(var(--primary))',
                          inputText: 'hsl(var(--foreground))',
                          inputLabelText: 'hsl(var(--foreground))',
                          inputBorder: 'hsl(var(--border))',
                          inputBackground: 'hsl(var(--secondary))',
                          messageText: 'hsl(var(--muted-foreground))',
                          messageTextDanger: 'hsl(var(--destructive))',
                          anchorTextColor: 'hsl(var(--primary))',
                          anchorTextHoverColor: 'hsl(var(--primary))',
                        },
                        radii: {
                          borderRadiusButton: '0.5rem',
                          buttonBorderRadius: '0.5rem',
                          inputBorderRadius: '0.5rem',
                        },
                      },
                    },
                  }}
                  providers={[]}
                  view="sign_in"
                  showLinks={true}
                  magicLink={true}
                  redirectTo={`${window.location.origin}/dashboard`}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}
