import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import CodePlaygroundScreen from '../screens/playground/CodePlaygroundScreen';
import ShortsScreen from '../screens/shorts/ShortsScreen';
import FoundersScreen from '../screens/founders/FoundersScreen';
import RoadmapDetailScreen from '../screens/roadmap/RoadmapDetailScreen';
import BattleLobbyScreen from '../screens/battle/BattleLobbyScreen';
import BattleMatchingScreen from '../screens/battle/BattleMatchingScreen';
import BattleArenaScreen from '../screens/battle/BattleArenaScreen';
import BattleResultScreen from '../screens/battle/BattleResultScreen';
import ForumScreen from '../screens/forum/ForumScreen';
import { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Playground" component={CodePlaygroundScreen} />
      <Stack.Screen name="Shorts" component={ShortsScreen} />
      <Stack.Screen name="Founders" component={FoundersScreen} />
      <Stack.Screen name="RoadmapDetail" component={RoadmapDetailScreen} />
      <Stack.Screen name="BattleLobby" component={BattleLobbyScreen} />
      <Stack.Screen name="BattleMatching" component={BattleMatchingScreen} />
      <Stack.Screen name="BattleArena" component={BattleArenaScreen} />
      <Stack.Screen name="BattleResult" component={BattleResultScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
