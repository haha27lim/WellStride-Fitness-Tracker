import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns'; // For date formatting
import apiDirect from '@/services/apiDirect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchProgressDashboard } from '@/store/slices/progressSlice';


const GoalsPage = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for the goal form
    const [goalType, setGoalType] = useState('');
    const [targetValue, setTargetValue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [formError, setFormError] = useState('');


    const fetchGoals = async () => {
        setLoading(true);
        setError(null);
        
        try { 
            const fetchedGoals = await apiDirect.get('/api/goals');
            setGoals(Array.isArray(fetchedGoals) ? fetchedGoals : fetchedGoals?.data || []);
        } catch (err) {
            console.error('Error fetching goals:', err);
            setError('Failed to fetch goals. Try again later.');
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleAddGoal = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!goalType.trim()) {
            setFormError('Goal type cannot be blank.');
            return;
        }
        
        const targetNum = parseFloat(targetValue);
        if (isNaN(targetNum) || targetNum <= 0) {
            setFormError('Target value must be a positive number.');
            return;
        }
        
        if (!startDate) {
            setFormError('Start date is required.');
            return;
        }

        const goalData = {
            goalType,
            targetValue: targetNum,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : undefined
        };

        try {
            const newGoal = await apiDirect.post<GoalDto>('/api/goals', goalData);
            setGoals(prevGoals => [...prevGoals, newGoal]);
            dispatch(fetchProgressDashboard()); 

            // Clear form on success
            setGoalType('');
            setTargetValue('');
            setStartDate('');
            setEndDate('');
        } catch (err) {
            console.error('Error adding goal:', err);
            setFormError('Failed to add goal. Try again later.');
        }
    };

    const handleStatusChange = async (goal, newStatus) => {
        try {
            const updatedGoal = {
                status: newStatus
            };
            
            const result = await apiDirect.put<GoalDto>(`/api/goals/${goal.id}`, updatedGoal);
            
            setGoals(prevGoals => 
                prevGoals.map(g => g.id === goal.id ? result : g)
            );
        } catch (err) {
            console.error('Error updating goal:', err);
            setError('Failed to update goal. Try again later.');
        }
    };

    const handleDeleteGoal = async (id) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            try {
                await apiDirect.delete(`/api/goals/${id}`);
                setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
            } catch (err) {
                console.error('Error deleting goal:', err);
                setError('Failed to delete goal. Try again later.');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Goals</h1>
            </div>
            
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Add New Goal</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddGoal} className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="goalType">Goal Type</Label>
                                <Input
                                    id="goalType"
                                    placeholder="e.g., Run 5km, Lose 2kg"
                                    value={goalType}
                                    onChange={(e) => setGoalType(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="targetValue">Target Value</Label>
                                <Input
                                    id="targetValue"
                                    type="number"
                                    placeholder="e.g., 5, 2"
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    required
                                    step="any"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="endDate">End Date (Optional)</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} // End date cannot be before start date
                                />
                            </div>
                        </div>
                        {formError && <p className="text-red-500 text-sm">{formError}</p>}
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Goal'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Your Goals</h2>
            {loading && goals.length === 0 && <p>Loading goals...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && goals.length === 0 && <p>No goals set yet.</p>}
            <div className="space-y-4">
                {goals.map((goal) => (
                    <Card key={goal.id}>
                        <CardHeader>
                            <CardTitle>{goal.goalType}</CardTitle>
                            <CardDescription>
                                Target: {goal.targetValue} | Current: {goal.currentValue ?? 0}
                            </CardDescription>
                            <CardDescription>
                                Start: {format(new Date(goal.startDate), 'PPP')}
                                {goal.endDate && ` | End: ${format(new Date(goal.endDate), 'PPP')}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Status: {goal.status}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Select
                                value={goal.status}
                                onValueChange={(value) => handleStatusChange(goal, value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Update Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">In Progress</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                                Delete
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default GoalsPage;