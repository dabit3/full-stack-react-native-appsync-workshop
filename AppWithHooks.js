import React, {
  useEffect, useReducer
} from 'react'
import {TextInput, Button, ScrollView, StyleSheet, Text, View} from 'react-native'

import uuid from 'uuid/v4'
import { API, graphqlOperation } from 'aws-amplify'
import { listRestaurants} from './src/graphql/queries'
import { createRestaurant } from './src/graphql/mutations'
import { onCreateRestaurant } from './src/graphql/subscriptions'

const CLIENTID = uuid()

const initialState = {
  error: null,
  restaurants: [],
  name: '', description: '', city: '', 
}

function reducer(state, action) {
  switch(action.type) {
    case 'set':
      return {
        ...state, restaurants: action.restaurants
      }
    case 'add':
      return {
        ...state,
        restaurants: [
          ...state.restaurants, action.restaurant
        ]
      }
    case 'error':
      return {
        ...state, error: true
      }
    case 'updateInput':
      return {
        ...state,
        [action.inputValue]: action.value
      }
    default:
      new Error()
  }
}

async function getRestaurants(dispatch) {
  try {
    const restaurantData = await API.graphql(graphqlOperation(listRestaurants))
    console.log('restaurantData:', restaurantData)
    dispatch({
      type: 'set',
      restaurants: restaurantData.data.listRestaurants.items
    })
  } catch (err) {
    dispatch({ type: 'error' })
    console.log('error fetching restaurants...', err)
  }
}

async function CreateRestaurant(state, dispatch) {
  const { name, description, city  } = state
  const restaurant = {
    name, 
    description,
    city,
    clientId: CLIENTID
  }
  
  const updatedRestaurantArray = [...state.restaurants, restaurant]
  dispatch({
    type: 'set',
    restaurants: updatedRestaurantArray
  })
  
  try {
    await API.graphql(graphqlOperation(createRestaurant, {
      input: restaurant
    }))
    console.log('item created!')
  } catch (err) {
    console.log('error creating restaurant...', err)
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
      const subscriber = API.graphql(graphqlOperation(onCreateRestaurant)).subscribe({
        next: eventData => {
          const restaurant = eventData.value.data.onCreateRestaurant
          if(CLIENTID === restaurant.clientId) return
          dispatch({ type: "add", restaurant })
        }
      })
    return () => subscriber.unsubscribe()
  }, [])

  useEffect(() => {
    getRestaurants(dispatch)
  }, [])
  console.log('state: ', state)
  return (
    <View style={styles.container}>
      <TextInput
          onChangeText={v => dispatch({
            type: 'updateInput',
            inputValue: 'name',
            value: v
          })}
          value={state.name}
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
        />
        <TextInput
          placeholder="description"
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChangeText={v => dispatch({
            type: 'updateInput',
            inputValue: 'description',
            value: v
          })}
          value={state.description}
        />
        <TextInput
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChangeText={v => dispatch({
            type: 'updateInput',
            inputValue: 'city',
            value: v
          })}
          value={state.city}
        />
        <Button onPress={() => CreateRestaurant(state, dispatch)} title='Create Restaurant' />
      {
        state.restaurants.map((restaurant, index) => (
          <View key={index} style={styles.restaurant}>
            <Text>{restaurant.name}</Text>
            <Text>{restaurant.description}</Text>
            <Text>{restaurant.city}</Text>
          </View>
        ))
      }
    </View>
  )
}
const styles = StyleSheet.create({
  restaurant: {
    padding: 15,
    borderBottomWidth: 2 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop: 80
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default App
