import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import apiDirect from '@/services/apiDirect';
import { fetchProgressDashboard } from '@/store/slices/progressSlice';
import Modal from '@/components/ui/Modal';

const WorkoutsPage = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);


    const [exerciseType, setExerciseType] = React.useState('');
    const [durationMinutes, setDurationMinutes] = React.useState('');
    const [intensity, setIntensity] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [formError, setFormError] = React.useState('');

    const fetchWorkouts = async () => {
        setLoading(true);
        setError(null);

        try {
            const fetchedWorkouts = await apiDirect.get('/api/workouts');
            setWorkouts(Array.isArray(fetchedWorkouts) ? fetchedWorkouts : fetchedWorkouts?.data || []);
        } catch (err) {
            console.error('Error fetching workouts:', err);
            setError('Failed to fetch workouts. Try again later.');
            setWorkouts([]); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const handleAddWorkout = async (e) => {
        e.preventDefault();
        setFormError('');

        const durationNum = parseInt(durationMinutes, 10);
        const intensityNum = parseInt(intensity, 10);

        if (isNaN(durationNum) || durationNum <= 0) {
            setFormError('Duration must be a positive number.');
            return;
        }
        if (isNaN(intensityNum) || intensityNum < 1 || intensityNum > 10) {
            setFormError('Intensity must be between 1 and 10.');
            return;
        }
        if (!exerciseType.trim()) {
            setFormError('Exercise type cannot be blank.');
            return;
        }

        const workoutData = {
            exerciseType,
            durationMinutes: durationNum,
            intensity: intensityNum,
            notes,
        };

        try {
            const newWorkout = await apiDirect.post('/api/workouts', workoutData);
            setWorkouts(prevWorkouts => [newWorkout, ...prevWorkouts]);
            dispatch(fetchProgressDashboard());


            setExerciseType('');
            setDurationMinutes('');
            setIntensity('');
            setNotes('');
            setModalOpen(false);
        } catch (err) {
            console.error('Error adding workout:', err);
            setFormError('Failed to add workout. Try again later.');
        }
    };

    const handleDeleteWorkout = async (id) => {
        if (window.confirm('Are you sure you want to delete this workout?')) {
            try {
                await apiDirect.delete(`/api/workouts/${id}`);
                setWorkouts(prevWorkouts => prevWorkouts.filter(workout => workout.id !== id));
            } catch (err) {
                console.error('Error deleting workout:', err);
                setError('Failed to delete workout. Try again later.');
            }
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Workouts</h1>
                    <p className="text-muted-foreground">Track and manage your fitness activities</p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="font-semibold">
                    + Add Workout
                </Button>
            </div>
            {workouts.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-96 border rounded-xl bg-white dark:bg-card shadow-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-primary/10 rounded-full p-4">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 20V10M12 10L8 14M12 10L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <div className="text-lg font-semibold">No workouts found</div>
                        <div className="text-muted-foreground mb-2">You haven't added any workouts yet.</div>
                        <Button onClick={() => setModalOpen(true)} className="font-semibold">
                            + Add Your First Workout
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {workouts.map((workout) => (
                        <Card key={workout.id}>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle>{workout.exerciseType}</CardTitle>
                                    <CardDescription>
                                        {format(new Date(workout.workoutTime), 'PPP p')} - {workout.durationMinutes} min - Intensity: {workout.intensity}/10
                                    </CardDescription>
                                </div>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteWorkout(workout.id)}>
                                    Delete
                                </Button>
                            </CardHeader>
                            {workout.notes && (
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Notes: {workout.notes}</p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Workout">
                <form onSubmit={handleAddWorkout} className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="exerciseType">Workout Name</Label>
                            <Input
                                id="exerciseType"
                                placeholder="e.g., Morning Run"
                                value={exerciseType}
                                onChange={(e) => setExerciseType(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                placeholder="e.g., 30"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(e.target.value)}
                                required
                                min="1"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="intensity">Intensity (1-10)</Label>
                            <Input
                                id="intensity"
                                type="number"
                                placeholder="e.g., 7"
                                value={intensity}
                                onChange={(e) => setIntensity(e.target.value)}
                                required
                                min="1"
                                max="10"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any additional details about your workout"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Workout'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default WorkoutsPage;