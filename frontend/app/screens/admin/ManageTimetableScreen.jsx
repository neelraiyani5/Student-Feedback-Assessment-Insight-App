import React, { useState, useEffect, useCallback } from 'react';
import { 
    StyleSheet, 
    View, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    Alert, 
    ActivityIndicator, 
    Modal,
    FlatList,
    Platform,
    SectionList,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from 'expo-router';

import AppText from '../../components/AppText';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { hp, wp } from '../../utils/responsive';
import { 
    getTimetableSheets, 
    uploadTimetable as processTimetable, 
    getTimetable 
} from '../../services/api';

// ─── Constants ────────────────────────────────────────────
const DAYS = [
    { key: 'MON', label: 'Mon' },
    { key: 'TUE', label: 'Tue' },
    { key: 'WED', label: 'Wed' },
    { key: 'THU', label: 'Thu' },
    { key: 'FRI', label: 'Fri' },
];

const DAY_FULL_NAMES = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday' };

const SLOT_COLORS = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EF4444', // Red
    '#14B8A6', // Teal
];

const getTodayKey = () => {
    const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
    const map = { 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI' };
    return map[dayIndex] || 'MON'; // Default to MON on weekends
};

// ─── Main Component ───────────────────────────────────────
const ManageTimetableScreen = () => {
    const router = useRouter();

    // Tab state
    const [activeTab, setActiveTab] = useState('SCHEDULE'); // SCHEDULE | SEARCH

    // Schedule tab state
    const [selectedDay, setSelectedDay] = useState(getTodayKey());
    const [scheduleEntries, setScheduleEntries] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    // Search tab state
    const [searchType, setSearchType] = useState('FACULTY');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [sheetModal, setSheetModal] = useState({ visible: false, sheets: [], tempPath: '' });

    // ─── Schedule Logic ──────────────────────────────────
    useEffect(() => {
        if (activeTab === 'SCHEDULE') {
            fetchDaySchedule(selectedDay);
        }
    }, [selectedDay, activeTab]);

    const fetchDaySchedule = async (day) => {
        setScheduleLoading(true);
        try {
            const data = await getTimetable({ day });
            setScheduleEntries(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Day schedule fetch failed', err);
            setScheduleEntries([]); // Show empty state on error instead of stuck loading
        } finally {
            setScheduleLoading(false);
        }
    };

    const handleDayPress = (dayKey) => {
        setSelectedDay(dayKey);
    };

    // ─── Search Logic ────────────────────────────────────
    const handleSearch = async () => {
        const q = searchQuery.trim();
        if (!q) return Alert.alert('Enter a search term', 'Please type a faculty name or room number.');
        setSearchLoading(true);
        setHasSearched(true);
        try {
            const params = searchType === 'FACULTY' ? { facultyName: q } : { room: q };
            const data = await getTimetable(params);
            setSearchResults(data || []);
        } catch (err) {
            Alert.alert('Search failed', 'Could not fetch results.');
        } finally {
            setSearchLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
    };

    // Group search results by day
    const getGroupedResults = () => {
        const grouped = {};
        searchResults.forEach(entry => {
            if (!grouped[entry.day]) grouped[entry.day] = [];
            grouped[entry.day].push(entry);
        });
        // Return in day order
        return DAYS
            .filter(d => grouped[d.key])
            .map(d => ({ title: DAY_FULL_NAMES[d.key], data: grouped[d.key] }));
    };

    // ─── Upload Logic ────────────────────────────────────
    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-excel",
                ],
            });
            if (result.canceled) return;

            const file = result.assets[0];
            const formData = new FormData();
            formData.append("file", {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            setUploading(true);
            const res = await getTimetableSheets(formData);
            setUploading(false);

            if (res.sheets && res.sheets.length > 0) {
                setSheetModal({ visible: true, sheets: res.sheets, tempPath: res.tempPath });
            }
        } catch (error) {
            setUploading(false);
            Alert.alert("Upload Error", error.message || "Failed to read Excel sheets");
        }
    };

    const handleSheetSelect = async (sheetName) => {
        setSheetModal(prev => ({ ...prev, visible: false }));
        setUploading(true);
        try {
            const res = await processTimetable({ sheetName, tempPath: sheetModal.tempPath });
            Alert.alert("Success", `Extracted ${res.count} entries from ${sheetName}`);
            // Refresh the current day view
            if (activeTab === 'SCHEDULE') fetchDaySchedule(selectedDay);
        } catch (error) {
            Alert.alert("Processing Error", error.message || "Failed to process timetable");
        } finally {
            setUploading(false);
        }
    };

    // ─── Renderers ───────────────────────────────────────
    const getSlotColor = (time) => {
        // Hash the time string to get a consistent color
        let hash = 0;
        for (let i = 0; i < time.length; i++) hash = time.charCodeAt(i) + ((hash << 5) - hash);
        return SLOT_COLORS[Math.abs(hash) % SLOT_COLORS.length];
    };

    const ScheduleCard = ({ item, index }) => {
        const color = getSlotColor(item.startTime);
        return (
            <View style={styles.scheduleCard}>
                {/* Time Block */}
                <View style={[styles.timeBlock, { backgroundColor: color + '15' }]}>
                    <AppText style={[styles.timeStart, { color }]}>{item.startTime}</AppText>
                    <View style={[styles.timeDivider, { backgroundColor: color }]} />
                    <AppText style={[styles.timeEnd, { color: color + 'BB' }]}>{item.endTime}</AppText>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    <AppText variant="h3" style={styles.subjectName} numberOfLines={1}>{item.subject?.name || '—'}</AppText>
                    
                    <View style={styles.cardMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="person" size={13} color={COLORS.textSecondary} />
                            <AppText variant="body2" style={styles.metaText} numberOfLines={1}>
                                {item.faculty?.name || '—'}
                            </AppText>
                        </View>
                    </View>

                    <View style={styles.cardBadges}>
                        <View style={[styles.badge, { backgroundColor: color + '15' }]}>
                            <Ionicons name="location" size={11} color={color} />
                            <AppText style={[styles.badgeText, { color }]}>{item.room || '—'}</AppText>
                        </View>
                        <View style={[styles.badge, { backgroundColor: COLORS.surfaceLight }]}>
                            <AppText style={[styles.badgeText, { color: COLORS.textSecondary }]}>
                                Sem {item.semester?.sem} · {item.class?.name}
                            </AppText>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const SearchResultCard = ({ item }) => {
        const color = getSlotColor(item.startTime);
        return (
            <View style={styles.searchCard}>
                <View style={[styles.searchCardAccent, { backgroundColor: color }]} />
                <View style={styles.searchCardBody}>
                    <View style={styles.searchCardTop}>
                        <AppText style={styles.searchSubject} numberOfLines={1}>{item.subject?.name || '—'}</AppText>
                        <View style={[styles.badge, { backgroundColor: color + '15', marginLeft: 8 }]}>
                            <AppText style={[styles.badgeText, { color }]}>{item.room || '—'}</AppText>
                        </View>
                    </View>
                    <View style={styles.searchCardBottom}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={13} color={COLORS.textLight} />
                            <AppText variant="caption" style={styles.metaText}>{item.startTime} - {item.endTime}</AppText>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="person-outline" size={13} color={COLORS.textLight} />
                            <AppText variant="caption" style={styles.metaText} numberOfLines={1}>{item.faculty?.name}</AppText>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="school-outline" size={13} color={COLORS.textLight} />
                            <AppText variant="caption" style={styles.metaText}>Sem {item.semester?.sem} · {item.class?.name}</AppText>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // ─── Main Render ─────────────────────────────────────
    return (
        <ScreenWrapper backgroundColor="#F1F5F9" withPadding={false}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <AppText variant="h2" style={styles.headerTitle}>Timetable</AppText>
            </View>

            {/* ── Tab Bar ── */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'SCHEDULE' && styles.tabActive]}
                    onPress={() => setActiveTab('SCHEDULE')}
                >
                    <Ionicons name="calendar" size={16} color={activeTab === 'SCHEDULE' ? COLORS.primary : COLORS.textLight} />
                    <AppText style={[styles.tabLabel, activeTab === 'SCHEDULE' && styles.tabLabelActive]}>Schedule</AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'SEARCH' && styles.tabActive]}
                    onPress={() => setActiveTab('SEARCH')}
                >
                    <Ionicons name="search" size={16} color={activeTab === 'SEARCH' ? COLORS.primary : COLORS.textLight} />
                    <AppText style={[styles.tabLabel, activeTab === 'SEARCH' && styles.tabLabelActive]}>Search</AppText>
                </TouchableOpacity>
            </View>

            {/* ── SCHEDULE TAB ── */}
            {activeTab === 'SCHEDULE' && (
                <>
                    {/* Day Pills */}
                    <View style={styles.dayPillRow}>
                        {DAYS.map(d => {
                            const isActive = selectedDay === d.key;
                            const isToday = getTodayKey() === d.key;
                            return (
                                <TouchableOpacity 
                                    key={d.key}
                                    style={[styles.dayPill, isActive && styles.dayPillActive]}
                                    onPress={() => handleDayPress(d.key)}
                                >
                                    <AppText style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>
                                        {d.label}
                                    </AppText>
                                    {isToday && <View style={[styles.todayDot, isActive && styles.todayDotActive]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Day Title */}
                    <View style={styles.dayTitleRow}>
                        <AppText variant="h3" style={styles.dayTitle}>{DAY_FULL_NAMES[selectedDay]}</AppText>
                        <AppText variant="caption" style={styles.entryCount}>
                            {scheduleEntries.length} {scheduleEntries.length === 1 ? 'lecture' : 'lectures'}
                        </AppText>
                    </View>

                    {/* Schedule List */}
                    {scheduleLoading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={scheduleEntries}
                            renderItem={({ item, index }) => <ScheduleCard item={item} index={index} />}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listPadding}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="sunny-outline" size={56} color={COLORS.border} />
                                    <AppText style={styles.emptyTitle}>No Lectures</AppText>
                                    <AppText variant="caption" style={styles.emptySub}>
                                        {DAY_FULL_NAMES[selectedDay]} is free — no lectures scheduled.
                                    </AppText>
                                </View>
                            }
                        />
                    )}
                </>
            )}

            {/* ── SEARCH TAB ── */}
            {activeTab === 'SEARCH' && (
                <>
                    {/* Search Bar */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchToggle}>
                            {['FACULTY', 'ROOM'].map(type => (
                                <TouchableOpacity 
                                    key={type}
                                    style={[styles.toggleBtn, searchType === type && styles.toggleActive]}
                                    onPress={() => { setSearchType(type); clearSearch(); }}
                                >
                                    <Ionicons 
                                        name={type === 'FACULTY' ? 'person' : 'business'} 
                                        size={14} 
                                        color={searchType === type ? COLORS.primary : COLORS.textLight} 
                                    />
                                    <AppText style={[styles.toggleText, searchType === type && styles.toggleTextActive]}>
                                        {type === 'FACULTY' ? 'Faculty' : 'Room'}
                                    </AppText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.searchInputRow}>
                            <View style={styles.searchInputBox}>
                                <Ionicons name="search" size={18} color={COLORS.textLight} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder={searchType === 'FACULTY' ? 'e.g. Dr. Sunil Lavadiya' : 'e.g. MA108'}
                                    placeholderTextColor={COLORS.textLight}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                />
                                {searchQuery !== '' && (
                                    <TouchableOpacity onPress={clearSearch}>
                                        <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Results */}
                    {searchLoading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : hasSearched ? (
                        <SectionList
                            sections={getGroupedResults()}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => <SearchResultCard item={item} />}
                            renderSectionHeader={({ section }) => (
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionLine} />
                                    <AppText style={styles.sectionTitle}>{section.title}</AppText>
                                    <View style={styles.sectionLine} />
                                </View>
                            )}
                            contentContainerStyle={styles.listPadding}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="search-outline" size={56} color={COLORS.border} />
                                    <AppText style={styles.emptyTitle}>No Results</AppText>
                                    <AppText variant="caption" style={styles.emptySub}>
                                        No timetable entries found for "{searchQuery}".
                                    </AppText>
                                </View>
                            }
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={56} color={COLORS.border} />
                            <AppText style={styles.emptyTitle}>Find a Schedule</AppText>
                            <AppText variant="caption" style={styles.emptySub}>
                                Search by faculty name or room number to see their weekly timetable.
                            </AppText>
                        </View>
                    )}
                </>
            )}

            {/* ── Upload FAB ── */}
            <TouchableOpacity 
                style={[styles.fab, uploading && { opacity: 0.6 }]}
                onPress={handlePickDocument}
                disabled={uploading}
                activeOpacity={0.8}
            >
                {uploading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                    <Ionicons name="cloud-upload" size={22} color={COLORS.white} />
                )}
            </TouchableOpacity>

            {/* ── Sheet Selection Modal ── */}
            <Modal
                visible={sheetModal.visible}
                transparent animationType="slide"
                onRequestClose={() => setSheetModal(prev => ({ ...prev, visible: false }))}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setSheetModal(prev => ({ ...prev, visible: false }))} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <AppText variant="h2" style={{ marginBottom: 4 }}>Select Sheet</AppText>
                        <AppText variant="caption" style={{ color: COLORS.textSecondary, marginBottom: SPACING.l }}>
                            Choose the timetable sheet to process.
                        </AppText>
                        
                        <ScrollView style={{ maxHeight: hp(40) }}>
                            {sheetModal.sheets.map((name, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.sheetItem}
                                    onPress={() => handleSheetSelect(name)}
                                >
                                    <View style={styles.sheetIcon}>
                                        <Ionicons name="document-text" size={18} color={COLORS.primary} />
                                    </View>
                                    <AppText style={styles.sheetName}>{name}</AppText>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity 
                            style={styles.cancelBtn}
                            onPress={() => setSheetModal(prev => ({ ...prev, visible: false }))}
                        >
                            <AppText style={{ color: COLORS.error, fontWeight: '600' }}>Cancel</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.s,
        paddingBottom: SPACING.m,
        backgroundColor: COLORS.white,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center', alignItems: 'center',
        marginRight: SPACING.m,
    },
    headerTitle: { fontSize: 22, color: COLORS.textPrimary },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.l,
        paddingBottom: SPACING.m,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: LAYOUT.radius.m,
        backgroundColor: COLORS.surfaceLight,
        gap: 6,
    },
    tabActive: {
        backgroundColor: COLORS.primary + '12',
        borderWidth: 1.5,
        borderColor: COLORS.primary + '30',
    },
    tabLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
    tabLabelActive: { color: COLORS.primary },

    // Day Pills
    dayPillRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        gap: 8,
    },
    dayPill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: LAYOUT.radius.m,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dayPillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...Platform.select({
            ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
            android: { elevation: 6 },
        }),
    },
    dayPillText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
    dayPillTextActive: { color: COLORS.white },
    todayDot: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },
    todayDotActive: { backgroundColor: COLORS.white },

    // Day Title
    dayTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingBottom: SPACING.s,
    },
    dayTitle: { fontSize: 18 },
    entryCount: { color: COLORS.textLight },

    // Schedule Card
    scheduleCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.l,
        marginBottom: SPACING.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    timeBlock: {
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.m,
    },
    timeStart: { fontSize: 14, fontWeight: '800' },
    timeDivider: { width: 16, height: 1.5, borderRadius: 1, marginVertical: 4 },
    timeEnd: { fontSize: 12, fontWeight: '600' },
    cardContent: {
        flex: 1,
        padding: SPACING.m,
        paddingLeft: SPACING.s,
    },
    subjectName: { fontSize: 15, marginBottom: 4 },
    cardMeta: { marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { marginLeft: 2, color: COLORS.textSecondary, fontSize: 12 },
    cardBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },

    // Search Section
    searchSection: {
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
    },
    searchToggle: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: 4,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: LAYOUT.radius.s,
        gap: 6,
    },
    toggleActive: {
        backgroundColor: COLORS.primary + '10',
    },
    toggleText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
    toggleTextActive: { color: COLORS.primary },
    searchInputRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.m },
    searchInputBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.m,
        height: 48,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.textPrimary },
    searchBtn: {
        width: 48, height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.m,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Search Result Card
    searchCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.s,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchCardAccent: { width: 4 },
    searchCardBody: { flex: 1, padding: SPACING.m },
    searchCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    searchSubject: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
    searchCardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

    // Section Headers (search grouped by day)
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.s,
        gap: 12,
    },
    sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Empty & Loading
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: hp(12), paddingHorizontal: SPACING.xl },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.m },
    emptySub: { color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

    // FAB
    fab: {
        position: 'absolute',
        bottom: hp(4),
        right: SPACING.l,
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
            android: { elevation: 8 },
        }),
    },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.xl,
        paddingBottom: hp(5),
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginBottom: SPACING.l,
    },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    sheetIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: COLORS.primary + '12',
        justifyContent: 'center', alignItems: 'center',
        marginRight: SPACING.m,
    },
    sheetName: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
    cancelBtn: { marginTop: SPACING.l, alignItems: 'center', padding: SPACING.m },

    // Shared
    listPadding: { paddingHorizontal: SPACING.l, paddingBottom: hp(12) },
});

export default ManageTimetableScreen;
