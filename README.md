# Building Full Stack GraphQL Applications with React Native & AWS AppSync

In this workshop we'll learn how to build cloud-enabled mobile applications with React Native, [AWS AppSync](https://aws.amazon.com/appsync/) & [AWS Amplify](https://aws-amplify.github.io/).

![](appsyncrnheader.jpg)

### Topics we'll be covering:

- [GraphQL API with AWS AppSync](https://github.com/dabit3/aws-amplify-workshop-react-native#adding-a-rest-api)
- [Authentication](https://github.com/dabit3/aws-amplify-workshop-react-native#adding-authentication)
- [Adding Authorization to the AWS AppSync API]
- [Creating & working with multiple serverless environments]
- [Deleting the resources]

## Redeeming our AWS Credit   

1. Visit the [AWS Console](https://console.aws.amazon.com/console).
2. In the top right corner, click on __My Account__.
![](dashboard1.jpg)
3. In the left menu, click __Credits__.
![](dashboard2.jpg)

## Getting Started - Creating the React Native Application

To get started, we first need to create a new React Native project & change into the new directory using the [React Native CLI](https://facebook.github.io/react-native/docs/getting-started.html) (See __Building Projects With Native Code__ in the documentation) or [Expo CLI](https://facebook.github.io/react-native/docs/getting-started).

If you already have the CLI installed, go ahead and create a new React Native app. If not, install the CLI & create a new app:

```bash
npm install -g react-native-cli

react-native init RNAppSync

# or

npm install -g expo-cli

expo init RNAppSync

> Choose a template: blank
```

Now change into the new app directory & install the AWS Amplify, AWS Amplify React Native, & uuid libraries:

```bash
cd RNAppSync

npm install --save aws-amplify aws-amplify-react-native uuid

# or

yarn add aws-amplify aws-amplify-react-native uuid
```

Finally, if you're __not using Expo CLI__ you need to link two native libraries:

```sh
react-native link react-native-vector-icons
react-native link amazon-cognito-identity-js
```

Next, run the app:

```sh
react-native run-ios

# or

expo start
```

## Installing the CLI & Initializing a new AWS Amplify Project

### Installing the CLI

Next, we'll install the AWS Amplify CLI:

```bash
npm install -g @aws-amplify/cli
```

Now we need to configure the CLI with our credentials:

```js
amplify configure
```

> If you'd like to see a video walkthrough of this configuration process, click [here](https://www.youtube.com/watch?v=fWbM5DLh25U).

Here we'll walk through the `amplify configure` setup. Once you've signed in to the AWS console, continue:
- Specify the AWS Region: __eu-central-1 or region closest to you__
- Specify the username of the new IAM user: __appsync-workshop-user__
> In the AWS Console, click __Next: Permissions__, __Next: Review__, & __Create User__ to create the new IAM user. Then, return to the command line & press Enter.
- Enter the access key of the newly created user:   
  accessKeyId: __(<YOUR_ACCESS_KEY_ID>)__   
  secretAccessKey:  __(<YOUR_SECRET_ACCESS_KEY>)__
- Profile Name: __(appsync-workshop-profile)__

### Initializing A New AWS Amplify Project

> Make sure to initialize this Amplify project in the root of your new React Native application

```bash
amplify init
```

- Enter a name for the project: __RNAppSyncApp__
- Enter a name for the environment: __local__
- Choose your default editor: __(Your favorite editor)__   
- Please choose the type of app that you're building __javascript__   
- What javascript framework are you using __react-native__   
- Source Directory Path: __/__   
- Distribution Directory Path: __/__
- Build Command: __npm run-script build__   
- Start Command: __npm run-script start__   
- Do you want to use an AWS profile? __Y__
- Please choose the profile you want to use: __appsync-workshop-profile__

Now, the AWS Amplify CLI has iniatilized a new project & you will see a couple of new files & folders: __amplify__ & __aws-exports.js__. These files hold your project configuration.

### Configuring the React Native applicaion to work with Amplify

We need to configure our React Native application to be aware of our new AWS Amplify project. We can do this by referencing the auto-generated `aws-exports.js` file that is now in our root folder.

To configure the app, open __App.js__ or __index.js__ and add the following code below the last import:

```js
import Amplify from 'aws-amplify'
import config from './aws-exports'
Amplify.configure(config)
```

Now, our app is ready to start using our AWS services.

## Adding a GraphQL API with AWS AppSync

To add a GraphQL API, we can use the following command:

```sh
amplify add api
```

Answer the following questions

- Please select from one of the above mentioned services __GraphQL__   
- Provide API name: __RestaurantAPI__   
- Choose an authorization type for the API __API key__   
- Do you have an annotated GraphQL schema? __N__   
- Do you want a guided schema creation? __Y__   
- What best describes your project: __Single object with fields (e.g. “Todo” with ID, name, description)__   
- Do you want to edit the schema now? (Y/n) __Y__   

> When prompted, update the schema to the following:   

```graphql
type Restaurant @model {
  id: ID!
  clientId: String
  name: String!
  description: String!
  city: String!
}
```

> Next, let's push the configuration to our account:

```bash
amplify push

> Do you want to generate code for your newly created GraphQL API: Y
> Choose the code generation language target: <Your target>
> Enter the file name pattern of graphql queries, mutations and subscriptions: (src/graphql/**/*.js)
> Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions: Y
> Enter maximum statement depth [increase from default if your schema is deeply nested]: (2)
```


> To view the new AWS AppSync API at any time after its creation, go to the dashboard at [https://console.aws.amazon.com/appsync](https://console.aws.amazon.com/appsync). Also be sure that your region is set correctly.

### Adding mutations from within the AWS AppSync Console

In the AWS AppSync console, open your API & then click on Queries.

Execute the following mutation to create a new restaurant in the API:

```graphql
mutation createRestaurant {
  createRestaurant(input: {
    name: "Nobu"
    description: "Great Sushi"
    city: "New York"
  }) {
    id name description city
  }
}
```

Now, let's query for the restaurant:

```graphql
query listRestaurants {
  listRestaurants {
    items {
      id
      name
      description
      city
    }
  }
}
```

We can even add search / filter capabilities when querying:

```graphql
query searchRestaurants {
  listRestaurants(filter: {
    city: {
      contains: "New York"
    }
  }) {
    items {
      id
      name
      description
      city
    }
  }
}
```

### Interacting with the GraphQL API from our client application - Querying for data

Now that the GraphQL API is created we can begin interacting with it!

The first thing we'll do is perform a query to fetch data from our API.

To do so, we need to define the query, execute the query, store the data in our state, then list the items in our UI.


```js
// App.js

// imports from Amplify library
import { API, graphqlOperation } from 'aws-amplify'

// import the query
import { listRestaurants } from './src/graphql/queries'

// define some state to hold the data returned from the API
state = {
  restaurants: []
}

// execute the query in componentDidMount
async componentDidMount() {
  try {
    const restaurantData = await API.graphql(graphqlOperation(listRestaurants))
    console.log('restaurantData:', restaurantData)
    this.setState({
      restaurants: restaurantData.data.listRestaurants.items
    })
  } catch (err) {
    console.log('error fetching restaurants...', err)
  }
}

// add UI in render method to show data
  {
    this.state.restaurants.map((restaurant, index) => (
      <View key={index}>
        <Text>{restaurant.name}</Text>
        <Text>{restaurant.description}</Text>
        <Text>{restaurant.city}</Text>
      </View>
    ))
  }
```

## Performing mutations

 Now, let's look at how we can create mutations.

```js
// additional imports
import {
  // ...existing imports
  TextInput, Button
} from 'react-native'
import { graphqlOperation, API } from 'aws-amplify'
import uuid from 'uuid/v4'
const CLIENTID = uuid()

// import the mutation
import { createRestaurant } from './src/graphql/mutations'

// add name & description fields to initial state
state = {
  name: '', description: '', city: '', restaurants: []
}

createRestaurant = async() => {
  const { name, description, city  } = this.state
  const restaurant = {
    name, description, city, clientId: CLIENTID
  }
  
  const updatedRestaurantArray = [...this.state.restaurants, restaurant]
  this.setState({ restaurants: updatedRestaurantArray })
  try {
    await API.graphql(graphqlOperation(createRestaurant, restaurant))
    console.log('item created!')
  } catch (err) {
    console.log('error creating restaurant...', err)
  }
}

// change state then user types into input
onChange = (key, value) => {
  this.setState({ [key]: value })
}

// add UI with event handlers to manage user input
<TextInput
  onChangeText={v => this.onChange('name', v)}
  value={this.state.name}
  style={{ width: 300, height: 50, margin: 5, backgroundColor: "#ddd" }}
/>
<TextInput
  style={{ width: 300, height: 50, margin: 5, backgroundColor: "#ddd" }}
  onChangeText={v => this.onChange('description', v)}
  value={this.state.description}
/>
<TextInput
  style={{ width: 300, height: 50, margin: 5, backgroundColor: "#ddd" }}
  onChangeText={v => this.onChange('city', v)}
  value={this.state.city}
/>
<Button onPress={this.createRestaurant} title='Create Restaurant' />
```

### GraphQL Subscriptions

Next, let's see how we can create a subscription to subscribe to changes of data in our API.

To do so, we need to define the subscription, listen for the subscription, & update the state whenever a new piece of data comes in through the subscription.

```js
// import the subscription
import { onCreateRestaurant } from './src/graphql/subscriptions'

// define the subscription in the class
this.subscription = {}

// subscribe in componentDidMount
componentDidMount() {
  this.subscription = API.graphql(
    graphqlOperation(onCreateRestaurant)
  ).subscribe({
      next: eventData => {
        console.log('eventData', eventData)
        const restaurant = eventData.value.data.onCreateRestaurant
        if(CLIENTID === restaurant.clientId) return
        const restaurants = [...this.state.restaurants, restaurant]
        setState({ restaurants })
      }
  });
}

// remove the subscription in componentWillUnmount
componentWillUnmount() {
  this.subscription.unsubscribe()
}
```

## Challenge

Recreate this functionality in Hooks

> For direction, check out the tutorial [here](https://medium.com/open-graphql/react-hooks-for-graphql-3fa8ebdd6c62)

## Adding Authentication

To add authentication, we can use the following command:

```sh
amplify add auth
```

> When prompted for __Do you want to use default authentication and security configuration?__, choose __Yes__

Now, we'll run the push command and the cloud resources will be created in our AWS account.

```bash
amplify push
```

> To view the new Cognito authentication service at any time after its creation, go to the dashboard at [https://console.aws.amazon.com/cognito/](https://console.aws.amazon.com/cognito/). Also be sure that your region is set correctly.

### Using the withAuthenticator component

To add authentication, we'll go into __App.js__ and first import the `withAuthenticator` HOC (Higher Order Component) from `aws-amplify-react`:

```js
import { withAuthenticator } from 'aws-amplify-react-native'
```

Next, we'll wrap our default export (the App component) with the `withAuthenticator` HOC:

```js
export default withAuthenticator(App)
```

Now, we can run the app and see that an Authentication flow has been added in front of our App component. This flow gives users the ability to sign up & sign in.

> To view the new user that was created in Cognito, go back to the dashboard at [https://console.aws.amazon.com/cognito/](https://console.aws.amazon.com/cognito/). Also be sure that your region is set correctly.

### Accessing User Data

We can access the user's info now that they are signed in by calling `Auth.currentAuthenticatedUser()`.

```js
import { Auth } from 'aws-amplify'

async componentDidMount() {
  const user = await Auth.currentAuthenticatedUser()
  console.log('user:', user)
  console.log('username:', user.username)
}
```

### Signing out the user using the withAuthenticator HOC

We can sign the user out using the `Auth` class & calling `Auth.signOut()`. This function returns a promise that is fulfilled after the user session has been ended & AsyncStorage is updated.

Because `withAuthenticator` holds all of the state within the actual component, we must have a way to rerender the actual `withAuthenticator` component by forcing React to rerender the parent component.

To do so, let's make a few updates:

```js
// index.js
class AppWrapper extends React.Component {
  rerender = () => this.forceUpdate()
  render() {
    return <App rerender={this.rerender} />
  }
}

AppRegistry.registerComponent(appName, () => AppWrapper);

// App.js
class App extends Component {
  signOut = async () => {
    await Auth.signOut()
    this.props.rerender()
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text onPress={this.signOut} style={styles.instructions}>Sign Out</Text>
      </View>
    );
  }
}

export default props =>  {
  const AppComponent = withAuthenticator(App)
  return <AppComponent {...props} />
}
```

### Custom authentication strategies

The `withAuthenticator` component is a really easy way to get up and running with authentication, but in a real-world application we probably want more control over how our form looks & functions.

Let's look at how we might create our own authentication flow.

To get started, we would probably want to create input fields that would hold user input data in the state. For instance when signing up a new user, we would probably need 4 user inputs to capture the user's username, email, password, & phone number.

To do this, we could create some initial state for these values & create an event handler that we could attach to the form inputs:

```js
// initial state
state = {
  username: '', password: '', email: '', phone_number: ''
}

// event handler
onChangeText = (key, value) => {
  this.setState({ [key]: value })
}

// example of usage with TextInput
<TextInput
  placeholder='username'
  value={this.state.username}
  style={{ width: 300, height: 50, margin: 5, backgroundColor: "#ddd" }}
  onChangeText={v => this.onChange('username', v)}
/>
```

We'd also need to have a method that signed up & signed in users. We can us the Auth class to do thi. The Auth class has over 30 methods including things like `signUp`, `signIn`, `confirmSignUp`, `confirmSignIn`, & `forgotPassword`. Thes functions return a promise so they need to be handled asynchronously.

```js
// import the Auth component
import { Auth } from 'aws-amplify'

// Class method to sign up a user
signUp = async() => {
  const { username, password, email, phone_number } = this.state
  try {
    await Auth.signUp({ username, password, attributes: { email, phone_number }})
  } catch (err) {
    console.log('error signing up user...', err)
  }
}
```

## Updating the AppSync API to use the new Authentication service

Next we need to change the AppSync API to now use the newly created Cognito Authentication service as the authentication type.

To do so, we'll reconfigure the API:

```sh
amplify configure
```



## Removing Services

If at any time, or at the end of this workshop, you would like to delete a service from your project & your account, you can do this by running the `amplify remove` command:

```sh
amplify remove auth

amplify push
```

If you are unsure of what services you have enabled at any time, you can run the `amplify status` command:

```sh
amplify status
```

`amplify status` will give you the list of resources that are currently enabled in your app.

## Deleting the amplify project & associated services

```sh
amplify delete
```
