import {
  useState,
  useRef,
  useContext,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import TicDriveButton from '../buttons/TicDriveButton';
import {Colors} from '@/constants/Colors';
import AuthContext from '@/stateManagement/contexts/auth/AuthContext';
import useJwtToken from '@/hooks/auth/useJwtToken';
import {useAppDispatch, useAppSelector} from '@/stateManagement/redux/hooks';
import {useTranslation} from 'react-i18next';
import generateTimeSlots from '@/utils/datetime/generateTimeSlots';
import {ScrollView} from 'react-native-gesture-handler';
import SafeAreaViewLayout from '@/app/layouts/SafeAreaViewLayout';
import getWorkshopNotAvailableDates from '@/services/http/requests/datetime/getWorkshopNotAvailableDates';
import useGlobalErrors from '@/hooks/errors/useGlobalErrors';
import ExtendedDay from '@/types/calendar/ExtendedDay';
import {Day} from '@/types/calendar/Day';
import {WorkshopWorkingHours} from '@/types/workshops/WorkshopWorkingHours';
import getWorkshopWorkingHours from '@/services/http/requests/datetime/getWorkshopWorkingHours';
import TicDriveSpinner from '../spinners/TicDriveSpinner';
import {useServiceChoosenByCustomer} from '@/hooks/user/useServiceChoosenByCustomer';
import Service from '@/types/Service';
import {
  addService,
  setServices,
  setTime,
} from '@/stateManagement/redux/slices/bookingSlice';

const {height} = Dimensions.get('window');

LocaleConfig.locales.it = {
  monthNames: [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ],
  monthNamesShort: [
    'Gen',
    'Feb',
    'Mar',
    'Apr',
    'Mag',
    'Giu',
    'Lug',
    'Ago',
    'Set',
    'Ott',
    'Nov',
    'Dic',
  ],
  dayNames: [
    'Domenica',
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
  today: 'Oggi',
};

LocaleConfig.locales.en = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthNamesShort: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  dayNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today',
};

const getCalendarLocale = (languageCode: string) =>
  languageCode?.toLowerCase().startsWith('it') ? 'it' : 'en';

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export interface UserCalendarModalRef {
  openModal: (service?: Service) => void;
  closeModal: () => void;
}

interface UserCalendarModalProps {
  showButton?: boolean;
  workshopId: string;
}

const UserCalendarModal = forwardRef<
  UserCalendarModalRef,
  UserCalendarModalProps
>(({showButton = true, workshopId}, ref) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadinghours, setaLoadingHours] = useState(false);

  const token = useJwtToken();
  const {setErrorMessage} = useGlobalErrors();
  const {setLoginRouteName, setLoginRouteParams} = useContext(AuthContext);
  const workshop = useAppSelector(state => state.booking.workshop);
  const servicesChoosen = useServiceChoosenByCustomer();
  const car = useAppSelector(state => state.booking.car);
  const {t} = useTranslation();
  const languageCode = useAppSelector(state => state.language.languageCode);
  const calendarLocale = getCalendarLocale(languageCode);
  const [
    serviceSelectedFromWorkshopDetails,
    setServiceSelectedFromWorkshopDetails,
  ] = useState<Service | undefined>(undefined);

  const hasService =
    servicesChoosen.length > 0 || !!serviceSelectedFromWorkshopDetails;

  const buttonText = !hasService
    ? t('service.chooseService')
    : token
      ? car
        ? 'Conferma prenotazione'
        : 'Scegli veicolo'
      : 'Confirm ' + (!token ? 'and login' : '');

  const routeName = !hasService
    ? 'ChooseServicesScreen'
    : token
      ? car
        ? 'ReviewBookingDetailsScreen'
        : 'SelectVehicleScreen'
      : 'UserAuthenticationScreen';

  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [customDisabledDays, setCustomeDisabledDays] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkshopWorkingHours | null>(
    null,
  );

  const serviceTreeLevel = useAppSelector(
    state => state.booking.serviceTreeLevel,
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
    LocaleConfig.defaultLocale = calendarLocale;
  }, [calendarLocale]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const workingDaysData: {
          data: {
            days: Day[];
            dates: string[];
          };
        } = await getWorkshopNotAvailableDates(workshopId);

        setWorkingDays(workingDaysData.data.days.map(day => day.name));
        const mappedDisabledDays = workingDaysData.data.dates.map(
          date => date.split('T')[0],
        );
        setCustomeDisabledDays(mappedDisabledDays);
      } catch (error) {
        setErrorMessage(t('errors.fetchWorkshopUnavailableDates'));
      }
    };

    fetchData();
  }, []);

  const userTimeSlot = useMemo(() => {
    let range = [];
    if (
      workingHours?.morning &&
      workingHours?.morning.length === 2 &&
      workingHours?.morning[0] &&
      workingHours?.morning[1]
    ) {
      range.push({
        label: 'morning',
        slots: generateTimeSlots(
          workingHours?.morning[0],
          workingHours?.morning[1],
        ),
      });
    }
    if (
      workingHours?.afternoon &&
      workingHours?.afternoon.length === 2 &&
      workingHours?.afternoon[0] &&
      workingHours?.afternoon[1]
    ) {
      range.push({
        label: 'afternoon',
        slots: generateTimeSlots(
          workingHours?.afternoon[0],
          workingHours?.afternoon[1],
        ),
      });
    }
    return range;
  }, [workingHours]);

  const openModal = (service?: Service): void => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (service) {
      setServiceSelectedFromWorkshopDetails(service);
    }
  };

  const closeModal = (): void => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  useImperativeHandle(ref, () => ({
    openModal,
    closeModal,
  }));

  const onClick = () => {
    if (!selectedDate || !selectedTime) {
      setErrorMessage('Data o ora non selezionata.');
      return;
    }

    closeModal();
    setLoginRouteName('ReviewBookingDetailsScreen');
    setLoginRouteParams({workshop, date: selectedDate, time: selectedTime});

    if (serviceSelectedFromWorkshopDetails) {
      dispatch(
        addService({
          service: serviceSelectedFromWorkshopDetails,
          index: serviceTreeLevel - 1,
        }),
      );
    }

    const capitalizedDate = capitalize(
      new Date(selectedDate).toLocaleDateString(calendarLocale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    );

    const formattedTime = `${capitalizedDate} - ${selectedTime}`;

    dispatch(setTime(formattedTime));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e, gestureState) => {
        // Prevent intercepting touch events inside Calendar
        const touchY = e.nativeEvent.pageY;
        if (touchY < height * 0.3) return false;
        return true;
      },
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        if (gestureState.dy > 100) {
          closeModal();
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const daysToCheck = 180;
  const maxBookingDate = new Date(Date.now() + daysToCheck * 86400000);

  const generateDisabledDates = () => {
    const disabledDates: Record<string, {disabled: boolean}> = {};
    const today = new Date();

    for (let i = 0; i <= daysToCheck; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date
        .toLocaleDateString('en-US', {weekday: 'long'})
        .toLowerCase();

      if (workingDays.includes(dayOfWeek)) {
        disabledDates[dateStr] = {disabled: true};
      }
    }

    customDisabledDays.forEach(day => {
      disabledDates[day] = {disabled: true};
    });

    const pastLimit = new Date(today);
    pastLimit.setDate(today.getDate() - 1);
    for (
      let d = new Date(pastLimit);
      d >= new Date(2000, 0, 1);
      d.setDate(d.getDate() - 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      disabledDates[dateStr] = {disabled: true};
    }

    return disabledDates;
  };

  const disabledDates = generateDisabledDates();

  return (
    <>
      {showButton && (
        <TicDriveButton
          text={
            servicesChoosen.length > 0 || serviceSelectedFromWorkshopDetails
              ? t('bookNow')
              : t('service.bookAService')
          }
          onClick={openModal}
          customButtonStyle={styles.customButtonStyle}
          customContainerStyle={{width: '100%'}}
        />
      )}

      {modalVisible && (
        <Modal
          transparent
          animationType="none"
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.overlay} onPress={closeModal} />
            <Animated.View
              style={[
                styles.modalContent,
                {transform: [{translateY: slideAnim}]},
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.dragHandle} />
              <SafeAreaViewLayout tailwindCss="mb-0">
                <View className="justify-between flex-1 pb-1">
                  {!selectedDate && !loadinghours ? (
                    <View className="h-[420px]">
                      <View className="mb-1">
                        <Text
                          style={styles.sectionTitle}
                          allowFontScaling={false}
                        >
                          {t('date.selectADate').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.fixedCalendarContainer}>
                        <Calendar
                          firstDay={1}
                          monthFormat="MMMM yyyy"
                          renderHeader={date => {
                            if (!date) {
                              return null;
                            }

                            const formattedHeader = capitalize(
                              new Date(
                                date.getFullYear(),
                                date.getMonth(),
                                1,
                              ).toLocaleDateString(calendarLocale, {
                                month: 'long',
                                year: 'numeric',
                              }),
                            );

                            return (
                              <Text
                                style={styles.calendarHeaderText}
                                allowFontScaling={false}
                              >
                                {formattedHeader}
                              </Text>
                            );
                          }}
                          onDayPress={async (day: ExtendedDay) => {
                            const date = new Date(day.dateString);
                            const dayOfWeek = new Date(day.dateString)
                              .toLocaleDateString(languageCode, {
                                weekday: 'long',
                              })
                              .toLowerCase();

                            if (
                              disabledDates[day.dateString] ||
                              workingDays.includes(dayOfWeek)
                            )
                              return;
                            const dayName = date.toLocaleDateString(
                              languageCode,
                              {
                                weekday: 'long',
                              },
                            );
                            setaLoadingHours(true);
                            const workingHoursData =
                              await getWorkshopWorkingHours(
                                workshopId,
                                dayName,
                              );
                            setaLoadingHours(false);
                            setWorkingHours(workingHoursData.data[0] ?? null);

                            if (selectedDate === day.dateString) {
                              setSelectedDate(null);
                              setSelectedTime(null);
                            } else {
                              setSelectedDate(day.dateString);
                              setSelectedTime(null);
                            }
                          }}
                          markedDates={{
                            [selectedDate ?? '']: {
                              selected: true,
                              marked: false,
                              selectedColor: Colors.light.green.drive,
                            },
                            ...disabledDates,
                          }}
                          maxDate={maxBookingDate.toISOString().split('T')[0]}
                          theme={{
                            selectedDayTextColor: 'white',
                            todayTextColor: Colors.light.green.drive,
                            dayTextColor: 'black',
                            textDisabledColor: '#b3b3b3',
                          }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={{alignItems: 'center'}} className="h-[420px]">
                      {loadinghours ? (
                        <View
                          style={{marginBottom: 20}}
                          className="h-44 flex-1"
                        >
                          <TicDriveSpinner />
                        </View>
                      ) : (
                        selectedDate && (
                          <>
                            <Text
                              style={styles.selectedDateText}
                              allowFontScaling={false}
                            >
                              {capitalize(
                                new Date(selectedDate).toLocaleDateString(
                                  calendarLocale,
                                  {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  },
                                ),
                              )}
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSelectedDate(null)}
                              style={{marginTop: 4}}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: '#999',
                                  textDecorationLine: 'underline',
                                }}
                                allowFontScaling={false}
                              >
                                {t('date.changeDay')}
                              </Text>
                            </TouchableOpacity>
                            <Text
                              style={styles.sectionTitle}
                              allowFontScaling={false}
                            >
                              {t('date.chooseSlot').toUpperCase()}
                            </Text>
                            <ScrollView
                              style={{marginBottom: 20}}
                              className="h-44"
                            >
                              {userTimeSlot.map(({label, slots}) => (
                                <View
                                  key={label}
                                  style={styles.timeSlotSection}
                                >
                                  <Text
                                    style={styles.timeSlotLabel}
                                    allowFontScaling={false}
                                  >
                                    {label === 'morning'
                                      ? t('date.days.morning')
                                      : t('date.days.afternoon')}
                                  </Text>
                                  <View style={styles.timeSlotGroup}>
                                    {slots.map(time => (
                                      <TouchableOpacity
                                        key={time}
                                        onPress={() =>
                                          setSelectedTime(
                                            selectedTime === time ? null : time,
                                          )
                                        }
                                        style={[
                                          styles.timeSlotButton,
                                          selectedTime === time &&
                                            styles.selectedSlot,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.timeSlotText,
                                            selectedTime === time &&
                                              styles.selectedSlotText,
                                          ]}
                                          allowFontScaling={false}
                                        >
                                          {time}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                </View>
                              ))}
                            </ScrollView>
                          </>
                        )
                      )}
                    </View>
                  )}

                  {/* {isDateAfterMaxRange(selectedDate) && (
                    <View style={styles.noticeWrapper}>
                      <Text style={styles.noticeText}>
                        You can book appointments up to 6 months in advance. For
                        later dates, please contact the workshop directly.
                      </Text>
                    </View>
                  )} */}

                  <TicDriveButton
                    text={buttonText}
                    disabled={!selectedDate || !selectedTime}
                    routeName={routeName}
                    replace={false}
                    onClick={onClick}
                  />
                </View>
              </SafeAreaViewLayout>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 0,
    maxHeight: height * 0.9,
  },
  dragHandle: {
    width: 60,
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 10,
  },
  customButtonStyle: {
    height: 50,
    paddingHorizontal: 15,
  },
  fixedCalendarContainer: {
    height: 370,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243042',
    textAlign: 'center',
    paddingVertical: 4,
  },
  noticeWrapper: {
    marginTop: 12,
    paddingHorizontal: 10,
  },
  selectedDateText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.light.green.drive,
    textAlign: 'center',
  },
  noticeText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.light.green.drive,
  },
  timeSlotSection: {
    marginBottom: 8,
  },
  timeSlotLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.green.drive,
    marginBottom: 4,
    marginTop: 12,
    textAlign: 'center',
  },
  timeSlotGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  timeSlotButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.green.drive,
    margin: 4,
  },
  selectedSlot: {
    backgroundColor: Colors.light.green.drive,
    borderColor: Colors.light.green.drive,
  },
  timeSlotText: {
    fontSize: 16,
    color: Colors.light.green.drive,
  },
  selectedSlotText: {
    color: '#fff',
  },
});

export default UserCalendarModal;
