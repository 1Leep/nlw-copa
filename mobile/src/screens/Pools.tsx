import { Octicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { FlatList, Icon, useToast, VStack } from "native-base";
import { useCallback, useState } from 'react';
import { Button } from "../components/Button";
import { EmptyPoolList } from '../components/EmptyPoolList';
import { Header } from "../components/Header";
import { Loading } from '../components/Loading';
import { PoolCard, PoolPros } from '../components/PoolCard';
import { api } from '../services/api';

export function Pools() {
  useFocusEffect(useCallback(() => { fetchPools() }, []));

  const [isLoading, setIsLoading] = useState(true);
  const [pools, setPools] = useState<PoolPros[]>([]);
  const navigation = useNavigation();
  const toast = useToast();

  async function fetchPools() {
    try {
      setIsLoading(true);

      const data = await api.get('/pools').then(res => res.data);
      setPools(data.pools);

    } catch (err) {
      console.log(err);
      toast.show({ title: 'Não foi possível listar os Bolões.', bgColor: 'red.500', placement: 'top' });
    }

    setIsLoading(false);
  }

  return (
    <VStack flex={1} bgColor='gray.900'>
      <Header title='Meus Bolões' />

      <VStack mt={6} mx={5} borderBottomWidth={1} borderBottomColor='gray.600' pb={4} mb={4}>
        <Button
          title='BUSCAR BOLÃO POR CÓDIGO'
          leftIcon={<Icon as={Octicons} name='search' color='black' size='md' />}
          onPress={() => navigation.navigate('find')}
        />
      </VStack>

      {
        isLoading
          ? <Loading />

          : <FlatList
            data={pools}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <PoolCard data={item} onPress={() => navigation.navigate('details', { id: item.id })} />}
            px={5}
            showsVerticalScrollIndicator={false}
            _contentContainerStyle={{ pb: 10 }}
            ListEmptyComponent={() => <EmptyPoolList />}
          />

      }


    </VStack>
  );
}