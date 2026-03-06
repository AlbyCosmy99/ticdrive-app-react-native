import TicDriveNavbar from '@/components/navigation/TicDriveNavbar';
import TicDriveButton from '@/components/ui/buttons/TicDriveButton';
import {Colors} from '@/constants/Colors';
import {LinearGradient} from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import necessaryDeviceBottomInset from '@/utils/devices/necessaryDeviceBottomInset';
import SafeAreaViewLayout from '@/app/layouts/SafeAreaViewLayout';
import {Image} from '@rneui/themed';
import {ActivityIndicator} from 'react-native';
import HorizontalLine from '@/components/ui/HorizontalLine';
import Verified from '@/assets/svg/verified.svg';
import CarRepair from '@/assets/svg/servicesIcons/car_repair.svg';
import CalendarIcon from '@/assets/svg/free_cancellation.svg';
import IconTextPair from '@/components/ui/IconTextPair';
import PaymentCard from '@/components/ui/payment/PaymentCard';
import {useContext, useEffect, useMemo, useState} from 'react';
import GlobalContext from '@/stateManagement/contexts/global/GlobalContext';
import NavigationContext from '@/stateManagement/contexts/nav/NavigationContext';
import {useAppDispatch, useAppSelector} from '@/stateManagement/redux/hooks';
import WorkshopReviewinfo from '@/components/workshop/reviews/WorkshopReviewInfo';
import CashIcon from '@/assets/svg/payment/cash.svg';
import CrossPlatformButtonLayout from '@/components/ui/buttons/CrossPlatformButtonLayout';
import openGoogleMaps from '@/services/map/openGoogleMaps';
import LocationPin from '@/assets/svg/location/PinLocation.svg';
import {useTranslation} from 'react-i18next';
import getUserMainImage from '@/utils/files/getUserMainImage';
import {useServiceChoosenByCustomer} from '@/hooks/user/useServiceChoosenByCustomer';
import formatPrice from '@/utils/currency/formatPrice.';
import getFullServiceName from '@/services/toString/getFullServiceName';
import getWorkshopWithServiceDetails from '@/services/http/requests/get/workshops/getWorkshopWithServiceDetails';
import {
  setPinCode,
  setWorkshop,
} from '@/stateManagement/redux/slices/bookingSlice';
import useGlobalErrors from '@/hooks/errors/useGlobalErrors';
import TicDriveSpinner from '@/components/ui/spinners/TicDriveSpinner';
import parseStringTimeToDate from '@/utils/dates/parseStringTimeToDate';
import navigationReset from '@/services/navigation/reset';
import registerCarAsync from '@/services/http/requests/post/cars/registerCarAsync';
import bookAServiceAsync from '@/services/http/requests/post/bookings/bookAServiceAsync';

export default function ReviewBookingDetailsScreen() {
  const {t} = useTranslation();
  const {userPaymentInfo} = useContext(GlobalContext);
  const {navigation} = useContext(NavigationContext);
  const dispatch = useAppDispatch();

  const servicesChoosen = useServiceChoosenByCustomer();
  const workshop = useAppSelector(state => state.booking.workshop);
  const time = useAppSelector(state => state.booking.time);
  const car = useAppSelector(state => state.booking.car);
  const token = useAppSelector(state => state.auth.token);
  const user = useAppSelector(state => state.auth.user);
  const languageCode = useAppSelector(state => state.language.languageCode);

  const [loading, setLoading] = useState(false);

  const {setErrorMessage} = useGlobalErrors();

  const price = useMemo(() => {
    return (
      '€ ' + formatPrice(workshop?.servicePrice ?? 0, workshop?.discount ?? 0)
    );
  }, [workshop]);

  useEffect(() => {
    const getWorkshopwithServiceData = async () => {
      if (
        (!workshop || !workshop.servicePrice) &&
        servicesChoosen?.length > 0
      ) {
        try {
          setLoading(true);
          const lastService = servicesChoosen[servicesChoosen.length - 1];
          const res = await getWorkshopWithServiceDetails(
            workshop?.id ?? '',
            lastService.id,
          );
          dispatch(setWorkshop(res.data.workshop));
        } catch (e: any) {
          setErrorMessage(e.message);
        } finally {
          setLoading(false);
        }
      }
    };
    if (!workshop || !workshop.servicePrice) {
      getWorkshopwithServiceData();
    }
  }, [servicesChoosen]);

  const onbookAService = async () => {
    try {
      setLoading(true);
      const res = await registerCarAsync(
        token ?? '',
        languageCode,
        car,
        user?.name,
      );
      const res2 = await bookAServiceAsync(
        token ?? '',
        workshop?.id ?? '',
        servicesChoosen[servicesChoosen.length - 1].id,
        res?.data.customerCarId ?? 0,
        Number(
          formatPrice(workshop?.servicePrice ?? 0, workshop?.discount ?? 0),
        ),
        parseStringTimeToDate(time),
      );
      dispatch(setPinCode(res2.data.bookingPinCode));

      navigationReset(navigation, 0, 'BookingConfirmationScreen', {
        workshop,
      });
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[
        Colors.light.backgroundLinearGradient.start,
        Colors.light.backgroundLinearGradient.end,
      ]}
      className={`flex-1 w-full h-full ${necessaryDeviceBottomInset()}`}
    >
      <SafeAreaViewLayout styles={[styles.container]}>
        <TicDriveNavbar
          topContent={
            <Text allowFontScaling={false} className="font-semibold text-lg">
              {t('reviewBooking.details')}
            </Text>
          }
        />
        {loading ? (
          <View className="flex-1">
            <TicDriveSpinner />
          </View>
        ) : (
          <ScrollView
            className="flex-1 mx-4 my-0 mb-2"
            showsVerticalScrollIndicator={false}
          >
            <View className="border rounded-xl border-slate-200 px-4">
              <View className="flex flex-row my-4">
                {workshop?.images.length && (
                  <Image
                    source={{uri: getUserMainImage(workshop.images)?.url}}
                    containerStyle={styles.image}
                    PlaceholderContent={
                      <ActivityIndicator
                        size="large"
                        color={Colors.light.bookingsOptionsText}
                      />
                    }
                  />
                )}
                <View>
                  <View className="flex flex-row items-center gap-1">
                    <Text
                      allowFontScaling={false}
                      className="text-xl font-medium"
                    >
                      {workshop?.workshopName}
                    </Text>
                    {workshop?.isVerified && <Verified width={24} />}
                  </View>
                  <WorkshopReviewinfo
                    meanStars={workshop?.meanStars}
                    numberOfReviews={workshop?.numberOfReviews}
                    textTailwindCss="text-tic"
                    containerTailwindCss="gap-1"
                  />
                </View>
              </View>
              <HorizontalLine color={Colors.light.lightGrey} />
              <View>
                {servicesChoosen && (
                  <IconTextPair
                    text={getFullServiceName(servicesChoosen)}
                    icon={<CarRepair fill={Colors.light.ticText} />}
                  />
                )}
                <IconTextPair
                  text={time}
                  icon={<CalendarIcon fill={Colors.light.ticText} />}
                />
                <CrossPlatformButtonLayout
                  onPress={() =>
                    openGoogleMaps(
                      workshop?.address ?? '',
                      workshop?.latitude ?? 0,
                      workshop?.longitude ?? 0,
                    )
                  }
                >
                  <IconTextPair
                    text={workshop?.address ?? ''}
                    textTailwindCss="underline text-tic pr-4"
                    icon={<LocationPin fill={Colors.light.ticText} />}
                  />
                </CrossPlatformButtonLayout>
              </View>
            </View>
            <View className="my-3">
              <Text
                allowFontScaling={false}
                className="text-tic text-sm font-medium mb-3"
              >
                {t('reviewBooking.subtotal')}
              </Text>
              <View className="border rounded-xl border-slate-200 p-4">
                <View className="flex flex-column justify-between items-end gap-y-1">
                  <Text allowFontScaling={false} className="text-sm text-tic">
                    {t('reviewBooking.serviceWithName', {
                      name: getFullServiceName(servicesChoosen),
                    })}
                  </Text>
                  <Text allowFontScaling={false}>{price}</Text>
                </View>
                <View
                  style={styles.promoCodeContainer}
                  className="mt-3 mb-3 flex flex-row justify-between items-center p-4 rounded-xl border-tic"
                >
                  <TextInput
                    placeholder={t('reviewBooking.promoCode')}
                    allowFontScaling={false}
                    style={{flex: 1}}
                  />
                  <Pressable>
                    <Text allowFontScaling={false} className="text-drive">
                      {t('reviewBooking.apply')}
                    </Text>
                  </Pressable>
                </View>
                <HorizontalLine />
                <View className="flex flex-row justify-between items-center mt-2">
                  <Text allowFontScaling={false} className="text-base text-tic">
                    {t('reviewBooking.total')}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="text-lg font-medium"
                  >
                    {price}
                  </Text>
                </View>
              </View>
            </View>
            <View>
              <View className="flex flex-row justify-between items-center mb-3">
                <Text
                  allowFontScaling={false}
                  className="text-tic text-sm font-medium"
                >
                  {t('reviewBooking.paymentMethod')}
                </Text>
              </View>
              <PaymentCard
                userName={userPaymentInfo?.choosenCard?.cardHolder ?? ''}
                paymentType={t('reviewBooking.payInWorkshop')}
                icon={<CashIcon width={24} fill={Colors.light.ticText} />}
                id={userPaymentInfo?.choosenCard?.id ?? 0}
                optionsVisible={false}
              />
            </View>
          </ScrollView>
        )}
        <HorizontalLine />
        <View>
          <View className="flex flex-row justify-between items-center mt-2 px-4">
            <Text allowFontScaling={false} className="text-base text-tic">
              {t('reviewBooking.total')}
            </Text>
            <Text allowFontScaling={false} className="text-xl font-medium">
              {price}
            </Text>
          </View>
          <View className="flex flex-row">
            {!navigation?.canGoBack?.() && (
              <View style={{flex: 2}}>
                <TicDriveButton
                  replace={true}
                  toTop={true}
                  customContainerStyle={{marginRight: 7}}
                  customButtonStyle={{backgroundColor: 'red'}}
                  text={'Annulla tutto'}
                  routeName="userTabs"
                  routeParams={{animation: 'fade'}}
                  stateRouteName="Home"
                />
              </View>
            )}
            <View style={{flex: 3}}>
              <TicDriveButton
                replace={true}
                toTop={true}
                customContainerStyle={{marginLeft: 7}}
                disabled={loading}
                text={t('reviewBooking.bookNow')}
                onClick={onbookAService}
              />
            </View>
          </View>
        </View>
      </SafeAreaViewLayout>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
  },
  success: {
    color: Colors.light.ticText,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  promoCodeContainer: {
    backgroundColor: '#F4F9F7',
    borderStyle: 'dotted',
    borderWidth: 1,
  },
});
