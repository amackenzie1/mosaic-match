import { Amplify } from 'aws-amplify'

export const configureAmplify = () => {
  const redirectSignIn = `${process.env.NEXT_PUBLIC_SIGN_IN_URL}`
  const redirectSignOut = `${process.env.NEXT_PUBLIC_SIGN_OUT_URL}`

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        loginWith: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
            scopes: [
              'email',
              'openid',
              'profile',
              'aws.cognito.signin.user.admin',
            ],
            redirectSignIn: [redirectSignIn],
            redirectSignOut: [redirectSignOut],
            responseType: 'code',
          },
        },
      },
    },
  })
}
